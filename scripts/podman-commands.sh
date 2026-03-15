#!/bin/bash

# Quick reference for Podman commands
# Usage: ./scripts/podman-commands.sh [command]

COMPOSE_FILE="podman-compose.yml"

case "$1" in
  start)
    echo "🚀 Starting all services..."
    podman-compose -f $COMPOSE_FILE start
    ;;
  
  stop)
    echo "🛑 Stopping all services..."
    podman-compose -f $COMPOSE_FILE stop
    ;;
  
  restart)
    echo "🔄 Restarting all services..."
    podman-compose -f $COMPOSE_FILE restart
    ;;
  
  status)
    echo "📊 Service status:"
    podman-compose -f $COMPOSE_FILE ps
    ;;
  
  logs)
    echo "📝 Showing logs (Ctrl+C to exit)..."
    podman-compose -f $COMPOSE_FILE logs -f
    ;;
  
  logs-backend)
    echo "📝 Showing backend logs (Ctrl+C to exit)..."
    podman-compose -f $COMPOSE_FILE logs -f backend
    ;;
  
  logs-frontend)
    echo "📝 Showing frontend logs (Ctrl+C to exit)..."
    podman-compose -f $COMPOSE_FILE logs -f frontend
    ;;
  
  logs-db)
    echo "📝 Showing database logs (Ctrl+C to exit)..."
    podman-compose -f $COMPOSE_FILE logs -f postgres
    ;;
  
  shell-backend)
    echo "🐚 Opening backend shell..."
    podman exec -it meals-backend sh
    ;;
  
  shell-db)
    echo "🐚 Opening database shell..."
    podman exec -it meals-postgres psql -U mealplanner -d meal_planner
    ;;
  
  backup-db)
    echo "💾 Backing up database..."
    mkdir -p backups
    BACKUP_FILE="backups/backup-$(date +%Y%m%d-%H%M%S).sql"
    podman exec meals-postgres pg_dump -U mealplanner meal_planner > $BACKUP_FILE
    echo "✅ Database backed up to: $BACKUP_FILE"
    ;;
  
  restore-db)
    if [ -z "$2" ]; then
      echo "❌ Please provide backup file: ./scripts/podman-commands.sh restore-db backups/backup-YYYYMMDD-HHMMSS.sql"
      exit 1
    fi
    echo "📥 Restoring database from: $2"
    cat $2 | podman exec -i meals-postgres psql -U mealplanner -d meal_planner
    echo "✅ Database restored"
    ;;
  
  migrate)
    echo "🔄 Running database migrations..."
    podman exec meals-backend sh -c "cd /app && npx prisma migrate deploy"
    ;;
  
  clean)
    echo "🧹 Cleaning up..."
    podman-compose -f $COMPOSE_FILE down
    echo "✅ Containers stopped and removed"
    ;;
  
  clean-all)
    echo "🧹 Cleaning up everything (including volumes)..."
    read -p "⚠️  This will delete all data. Are you sure? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
      podman-compose -f $COMPOSE_FILE down -v
      echo "✅ Containers and volumes removed"
    else
      echo "❌ Cancelled"
    fi
    ;;
  
  update)
    echo "🔄 Updating application..."
    git pull
    ./scripts/deploy-podman.sh
    ;;
  
  stats)
    echo "📊 Container resource usage:"
    podman stats --no-stream
    ;;
  
  health)
    echo "🏥 Checking application health..."
    echo "Main app:"
    curl -s http://localhost:8080/health || echo "❌ Not responding"
    echo -e "\nBackend API:"
    curl -s http://localhost:8080/api/health || echo "❌ Not responding"
    ;;
  
  *)
    echo "Meal Planner - Podman Commands"
    echo ""
    echo "Usage: ./scripts/podman-commands.sh [command]"
    echo ""
    echo "Available commands:"
    echo "  start           - Start all services"
    echo "  stop            - Stop all services"
    echo "  restart         - Restart all services"
    echo "  status          - Show service status"
    echo "  logs            - Show all logs"
    echo "  logs-backend    - Show backend logs"
    echo "  logs-frontend   - Show frontend logs"
    echo "  logs-db         - Show database logs"
    echo "  shell-backend   - Open backend shell"
    echo "  shell-db        - Open database shell"
    echo "  backup-db       - Backup database"
    echo "  restore-db FILE - Restore database from backup"
    echo "  migrate         - Run database migrations"
    echo "  clean           - Stop and remove containers"
    echo "  clean-all       - Stop and remove containers + volumes"
    echo "  update          - Pull latest code and redeploy"
    echo "  stats           - Show resource usage"
    echo "  health          - Check application health"
    echo ""
    ;;
esac

# Made with Bob
