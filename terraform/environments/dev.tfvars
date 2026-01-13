# =============================================================================
# Development Environment Configuration
# =============================================================================

# General
project_name = "quckchat"
environment  = "dev"
team_name    = "platform"
aws_region   = "us-east-1"

# VPC
vpc_cidr             = "10.0.0.0/16"
availability_zones   = ["us-east-1a", "us-east-1b"]
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]
enable_nat_gateway   = true
single_nat_gateway   = true  # Cost savings for dev

# Security
allowed_ssh_cidrs  = []  # Add your IP for bastion access
allowed_http_cidrs = ["0.0.0.0/0"]

# Database (DocumentDB)
db_instance_class          = "db.t3.medium"
db_instance_count          = 1
db_master_username         = "quckchat_admin"
db_backup_retention_period = 1
db_preferred_backup_window = "03:00-04:00"

# Redis (ElastiCache)
redis_node_type            = "cache.t3.micro"
redis_num_cache_nodes      = 1
redis_parameter_group_family = "redis7"
redis_engine_version       = "7.0"

# ECS/Fargate
container_image    = "quckchat/backend:dev"
container_port     = 3000
ecs_cpu            = 256
ecs_memory         = 512
ecs_desired_count  = 1
health_check_path  = "/health"

# ECS Auto Scaling
enable_ecs_autoscaling = false
ecs_min_capacity       = 1
ecs_max_capacity       = 2
ecs_cpu_target_value   = 80
ecs_memory_target_value = 85

# S3
s3_enable_versioning    = false
s3_cors_allowed_origins = ["http://localhost:*", "http://127.0.0.1:*"]
s3_enable_lifecycle_rules = false

# Monitoring
log_retention_days       = 7
enable_cloudwatch_alarms = false
alarm_notification_email = ""
cpu_alarm_threshold      = 90
memory_alarm_threshold   = 90
