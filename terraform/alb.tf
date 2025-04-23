resource "aws_lb" "spotserver" {
  name               = "${var.app_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = {
    Name        = "${var.app_name}-alb"
    Environment = var.app_environment
  }
}

resource "aws_lb_target_group" "spotserver" {
  name        = "${var.app_name}-tg"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    interval            = 30
    path                = var.health_check_path
    port                = "traffic-port"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    protocol            = "HTTP"
    matcher             = "200-299"
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "${var.app_name}-tg"
    Environment = var.app_environment
  }
}

# HTTP 리스너 - HTTPS로 리디렉션
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.spotserver.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.spotserver.arn
  }

  tags = {
    Name        = "${var.app_name}-http-listener"
    Environment = var.app_environment
  }
}

# HTTPS 리스너
resource "aws_lb_listener" "https" {
  count = var.domain_name != "" && var.create_certificate ? 1 : 0

  load_balancer_arn = aws_lb.spotserver.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = aws_acm_certificate_validation.cert_manual[0].certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.spotserver.arn
  }

  tags = {
    Name        = "${var.app_name}-https-listener"
    Environment = var.app_environment
  }
} 