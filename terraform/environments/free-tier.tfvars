# =============================================================================
# Free Tier Environment Configuration
# =============================================================================
# Optimized for AWS Free Tier + MongoDB Atlas Free Tier
# Estimated Cost: $0-5/month
# =============================================================================

# General
project_name = "quckchat"
environment  = "dev"
aws_region   = "ap-south-1"  # Mumbai region

# VPC (Simplified - single subnet)
vpc_cidr           = "10.0.0.0/16"
public_subnet_cidr = "10.0.1.0/24"
availability_zone  = "ap-south-1a"  # Mumbai AZ

# Security
# IMPORTANT: Replace with your IP for security!
# Get your IP: curl ifconfig.me
allowed_ssh_cidrs = ["0.0.0.0/0"]  # TODO: Change to ["YOUR_IP/32"]

# EC2 (Free Tier)
ec2_instance_type = "t2.micro"  # Free tier eligible
ec2_key_name      = "quckchat-key"  # Create this in AWS Console first!

# Application
container_port = 3000

# MongoDB Atlas (Free Tier M0)
# Get this from MongoDB Atlas after creating your cluster
# Format: mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
mongodb_atlas_uri = "mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/quickchat?retryWrites=true&w=majority"

# S3 CORS
s3_cors_allowed_origins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",  # Vite dev server
  "*"  # TODO: Remove in production, add your actual domains
]
