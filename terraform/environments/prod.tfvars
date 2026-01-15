# =============================================================================
# Production Environment Configuration
# =============================================================================

# General
project_name = "quckapp"
environment  = "prod"
team_name    = "platform"
aws_region   = "us-east-1"

# VPC
vpc_cidr             = "10.0.0.0/16"
availability_zones   = ["us-east-1a", "us-east-1b", "us-east-1c"]
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
enable_nat_gateway   = true
single_nat_gateway   = false  # HA for production

# Security
allowed_ssh_cidrs  = []  # VPN or specific IPs only
allowed_http_cidrs = ["0.0.0.0/0"]

# Database (DocumentDB)
db_instance_class          = "db.r5.large"
db_instance_count          = 3  # Primary + 2 replicas
db_master_username         = "quckapp_admin"
db_backup_retention_period = 35
db_preferred_backup_window = "03:00-04:00"

# Redis (ElastiCache)
redis_node_type            = "cache.r6g.large"
redis_num_cache_nodes      = 3  # Primary + 2 replicas
redis_parameter_group_family = "redis7"
redis_engine_version       = "7.0"

# ECS/Fargate
container_image    = "quckapp/backend:latest"
container_port     = 3000
ecs_cpu            = 1024
ecs_memory         = 2048
ecs_desired_count  = 3
health_check_path  = "/health"

# ECS Auto Scaling
enable_ecs_autoscaling = true
ecs_min_capacity       = 3
ecs_max_capacity       = 20
ecs_cpu_target_value   = 70
ecs_memory_target_value = 80

# S3
s3_enable_versioning    = true
s3_cors_allowed_origins = ["https://quckapp.com", "https://www.quckapp.com", "https://app.quckapp.com"]
s3_enable_lifecycle_rules = true

# Monitoring
log_retention_days       = 90
enable_cloudwatch_alarms = true
alarm_notification_email = "ops@quckapp.com"
cpu_alarm_threshold      = 80
memory_alarm_threshold   = 85
