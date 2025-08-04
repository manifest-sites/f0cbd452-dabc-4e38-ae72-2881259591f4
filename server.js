const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { execSync } = require('child_process');
const { getFilesRecursively } = require('./utils/fileUtils');
const { initializeClaudeCode, getQuery, isInitialized, getStatus } = require('./utils/claudeCode');
const { commitAndPushChanges } = require('./utils/gitUtils');
const { commitToGitRepo, buildAndUpload } = require('./utils/buildUtils');
require('dotenv').config();
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Claude Code SDK
initializeClaudeCode().catch(err => {
    console.error('Failed to initialize Claude Code SDK:', err);
});


app.get('/health', (req, res) => {
    res.json({
        message: "API is running",
        status: "active",
        timestamp: new Date().toISOString()
    });
});

// GET gh-test
app.get('/gh-test', (req, res) => {

    const result = commitAndPushChanges();
    
    if (result.success) {
        res.status(200).json({
            message: result.message,
            status: result.status,
            details: result.details
        });
    } else {
        res.status(500).json({
            message: result.message,
            status: result.status,
            details: result.details
        });
    }
});


// Endpoint for creating previews via LLM
app.post('/generate-preview', async (req, res) => {
    try {
        // Check if query is available
        if (!isInitialized()) {
            console.error('Query function not available');
            res.status(500).json({ error: 'Claude Code SDK not initialized' });
            return;
        }

        // Get message from request body
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ 
                error: 'Message is required',
                timestamp: new Date().toISOString()
            });
        }

        // Set up SSE headers for streaming
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });

        const query = getQuery();

        // Send initial status
        res.write(`data: ${JSON.stringify({
            type: 'status',
            message: 'Starting LLM processing...',
            timestamp: new Date().toISOString()
        })}\n\n`);

        // Call LLM to update the project
        const messageStream = query({
            prompt: message,
            options: {
                maxTurns: 50,
                permissionMode: 'acceptEdits',
                cwd: './project',
            },
        });

        // Process the stream and forward to client
        for await (const message of messageStream) {
            console.log('Received message from stream:', message);
            
            // Send each message to the client
            res.write(`data: ${JSON.stringify({
                type: 'llm_message',
                message: message,
                timestamp: new Date().toISOString()
            })}\n\n`);
        }

        // Send commit status
        res.write(`data: ${JSON.stringify({
            type: 'status',
            message: 'LLM processing complete. Committing changes...',
            timestamp: new Date().toISOString()
        })}\n\n`);

        // Commit changes with status updates
        const result = commitToGitRepo({
            commitMessage: "Static update message to ensure error is not coming from this.",
            statusCallback: (status) => {
                res.write(`data: ${JSON.stringify(status)}\n\n`);
            }
        });

        if (!result.success) {
            res.write(`data: ${JSON.stringify({
                type: 'error',
                error: 'Commit failed',
                details: result.error,
                timestamp: new Date().toISOString()
            })}\n\n`);
        }

        res.end();
    } catch (error) {
        console.error('Error in update:', error);
        
        // Send error via SSE if headers haven't been sent yet
        if (!res.headersSent) {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control'
            });
        }
        
        // Standard error response
        res.write(`data: ${JSON.stringify({
            type: 'error',
            error: 'Update failed',
            details: error.message,
            timestamp: new Date().toISOString()
        })}\n\n`);
        
        res.end();
    }
});

// Files endpoint
app.get('/files', (req, res) => {
    const projectPath = './project';
    
    try {
        // Check if directory exists
        if (!fs.existsSync(projectPath)) {
            return res.status(404).json({
                message: "Project directory not found",
                status: "error",
                path: projectPath,
                timestamp: new Date().toISOString()
            });
        }
        
        const files = getFilesRecursively(projectPath);
        res.json({
            message: "Files and folders in /project",
            status: "success",
            timestamp: new Date().toISOString(),
            data: files
        });
    } catch (error) {
        res.status(500).json({
            message: "Error reading project directory",
            status: "error",
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Claude Code SDK status endpoint
app.get('/claude-status', (req, res) => {
    try {
        const status = getStatus();
        res.json({
            message: "Claude Code SDK Status",
            status: "success",
            timestamp: new Date().toISOString(),
            data: status
        });
    } catch (error) {
        res.status(500).json({
            message: "Error getting Claude Code SDK status",
            status: "error",
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Deploy endpoint - builds project and deploys to S3 production
app.post('/deploy', async (req, res) => {
    try {
        // Set up SSE headers for streaming
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });

        // Send initial status
        res.write(`data: ${JSON.stringify({
            type: 'status',
            message: 'Starting build and deployment to production...',
            timestamp: new Date().toISOString()
        })}\n\n`);

        // Build and upload to S3 production with status updates
        const result = buildAndUpload({
            statusCallback: (status) => {
                res.write(`data: ${JSON.stringify(status)}\n\n`);
            }
        });

        if (!result.success) {
            res.write(`data: ${JSON.stringify({
                type: 'error',
                error: 'Build and deployment failed',
                details: result.error,
                timestamp: new Date().toISOString()
            })}\n\n`);
        }

        res.end();
    } catch (error) {
        console.error('Error in deployment:', error);
        
        // Send error via SSE if headers haven't been sent yet
        if (!res.headersSent) {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control'
            });
        }
        
        // Standard error response
        res.write(`data: ${JSON.stringify({
            type: 'error',
            error: 'Deployment failed',
            details: error.message,
            timestamp: new Date().toISOString()
        })}\n\n`);
        
        res.end();
    }
});

// PUT request to /config to update the manifest.config.json file
app.put('/config', async (req, res) => {
    try {
        const configPath = './project/manifest.config.json';
        
        // Check if the config file exists
        if (!fs.existsSync(configPath)) {
            return res.status(404).json({
                message: "Config file not found",
                status: "error",
                timestamp: new Date().toISOString()
            });
        }
        
        // Read existing config
        const existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Deep merge function to handle nested objects
        function deepMerge(target, source) {
            const result = { ...target };
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    result[key] = deepMerge(target[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
            return result;
        }
        
        // Merge new data with existing config using deep merge
        const updatedConfig = deepMerge(existingConfig, req.body);
        
        // Write updated config back to file
        fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 4));

        // Set up SSE headers for streaming
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });

        // Send initial response with updated config
        res.write(`data: ${JSON.stringify({
            type: 'config_updated',
            config: updatedConfig,
            timestamp: new Date().toISOString()
        })}\n\n`);

        // Commit changes with status updates
        const result = commitToGitRepo({
            commitMessage: 'Update configuration via API',
            statusCallback: (status) => {
                res.write(`data: ${JSON.stringify(status)}\n\n`);
            }
        });

        if (!result.success) {
            res.write(`data: ${JSON.stringify({
                type: 'error',
                error: 'Commit failed',
                details: result.error,
                timestamp: new Date().toISOString()
            })}\n\n`);
        }

        res.end();
    } catch (error) {
        console.error('Error in config update:', error);
        
        // Send error via SSE if headers haven't been sent yet
        if (!res.headersSent) {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control'
            });
        }
        
        res.write(`data: ${JSON.stringify({
            type: 'error',
            error: 'Config update failed',
            details: error.message,
            timestamp: new Date().toISOString()
        })}\n\n`);
        
        res.end();
    }
});

// GET request to /config to get the manifest.config.json file
app.get('/config', (req, res) => {
    try {
        const configPath = './project/manifest.config.json';
        
        // Check if the config file exists
        if (!fs.existsSync(configPath)) {
            return res.status(404).json({
                message: "Config file not found",
                status: "error",
                timestamp: new Date().toISOString()
            });
        }
        
        // Read and parse the config file
        const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        res.json(configData);
    } catch (error) {
        res.status(500).json({
            message: "Error reading config file",
            status: "error",
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});


app.use(
    '/',
    createProxyMiddleware({
      target: 'http://localhost:5173', // dev server
      changeOrigin: true,
      pathRewrite: { '^/project': '' }, // remove /project prefix
      ws: true // proxy websockets for hot reload
    })
  );


// Start server
app.listen(PORT, () => {
    console.log(`API server is running on port ${PORT}`);
}); 