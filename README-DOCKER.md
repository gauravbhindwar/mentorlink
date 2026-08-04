# Docker Setup for MentorLink Application

This document describes how to build and run the MentorLink application using Docker and Docker Compose with proper environment variable handling.

## Prerequisites

- Docker installed on your machine
- Docker Compose installed on your machine

## Project Structure

Docker-related files are organized in the `/infra` directory:
- `/infra/dockerfile` - Dockerfile for building the application image
- `/infra/docker-compose.yml` - Docker Compose configuration
- `/infra/.dockerignore` - Files to exclude from the Docker build

## Environment Configuration Best Practices

### Development Setup

1. Create a copy of `.env.example` as `.env.production`
2. Fill in your actual environment variables in `.env.production`
3. The Docker Compose file is configured to use `.env.production` via the `env_file` directive

### Production Setup

For production deployments, consider these best practices:

1. Never commit real secrets to version control
2. Use a CI/CD pipeline to inject environment variables during deployment
3. Consider using Docker secrets or a dedicated secrets management tool like HashiCorp Vault
4. For Kubernetes deployments, use Kubernetes Secrets

## Building and Starting the Application

To build and start the application:

```bash
# Navigate to the infra directory
cd infra

# Build the containers (first time or after changes)
docker-compose build

# Start the services
docker-compose up
```

The application will be available at http://localhost:3001

## Different Environment Files

You can use different environment files for different environments:

```bash
# Navigate to the infra directory
cd infra

# Use a specific environment file
docker-compose --env-file ../.env.staging up
```

## Overriding Environment Variables

You can override specific environment variables at runtime:

```bash
# Navigate to the infra directory
cd infra

# Override a specific environment variable
MONGODB_URI=mongodb://custom-mongo:27017/mentorlink docker-compose up
```

## Running in Background

To run the containers in the background:

```bash
cd infra
docker-compose up -d
```

## Stopping the Application

```bash
cd infra

# If running in foreground, press Ctrl+C
# If running in background:
docker-compose down
```

## Using Local MongoDB (Optional)

If you want to use a local MongoDB instance instead:

1. Uncomment the MongoDB service in `infra/docker-compose.yml`
2. Uncomment the volumes section in `infra/docker-compose.yml`
3. Override the MongoDB URI in docker-compose:
   ```bash
   MONGODB_URI=mongodb://mongo:27017/mentorlink docker-compose up
   ```
   
   Or modify the app service environment in docker-compose.yml:
   ```yaml
   environment:
     - NODE_ENV=production
     - PORT=3001
     - MONGODB_URI=mongodb://mongo:27017/mentorlink
   ```

## Security Considerations

- Do not expose MongoDB ports (27017) in production unless necessary
- Use strong passwords for database access
- Consider using Docker secrets for sensitive information
- For production, use a reverse proxy (like Nginx) with HTTPS

## Troubleshooting

If you encounter issues:

1. Check the logs for error messages:
   ```bash
   cd infra
   docker-compose logs app
   ```
2. Ensure the MongoDB connection string is correct
3. Verify that port 3001 is not already in use on your host machine
4. Check if all required environment variables are set
