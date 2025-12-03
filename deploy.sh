#!/bin/bash

# RideKada Docker Deployment Script
# Team NEXUS - IT/CS 311

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  RideKada Docker Deployment Script${NC}"
echo -e "${GREEN}  Team NEXUS - Saint Louis University${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Function to check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed${NC}"
        echo "Please install Docker from https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}Error: Docker Compose is not installed${NC}"
        echo "Please install Docker Compose"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"
}

# Function to start containers
start_containers() {
    echo ""
    echo -e "${YELLOW}Starting RideKada containers...${NC}"
    docker-compose up -d --build
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Containers started successfully!${NC}"
        echo ""
        echo -e "${GREEN}Access your application at:${NC}"
        echo -e "  RideKada App: ${YELLOW}http://localhost:8080${NC}"
        echo -e "  PHPMyAdmin:   ${YELLOW}http://localhost:8081${NC}"
        echo ""
        echo -e "${YELLOW}Waiting for MySQL to be ready...${NC}"
        sleep 5
        docker-compose ps
    else
        echo -e "${RED}✗ Failed to start containers${NC}"
        exit 1
    fi
}

# Function to stop containers
stop_containers() {
    echo ""
    echo -e "${YELLOW}Stopping RideKada containers...${NC}"
    docker-compose stop
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Containers stopped successfully!${NC}"
    else
        echo -e "${RED}✗ Failed to stop containers${NC}"
        exit 1
    fi
}

# Function to remove containers
remove_containers() {
    echo ""
    echo -e "${YELLOW}Removing RideKada containers...${NC}"
    read -p "This will remove all containers. Continue? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down
        echo -e "${GREEN}✓ Containers removed successfully!${NC}"
    else
        echo -e "${YELLOW}Operation cancelled${NC}"
    fi
}

# Function to view logs
view_logs() {
    echo ""
    echo -e "${YELLOW}Viewing logs (Press Ctrl+C to exit)...${NC}"
    docker-compose logs -f
}

# Function to show container status
show_status() {
    echo ""
    echo -e "${YELLOW}Container Status:${NC}"
    docker-compose ps
}

# Function to restart containers
restart_containers() {
    echo ""
    echo -e "${YELLOW}Restarting RideKada containers...${NC}"
    docker-compose restart
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Containers restarted successfully!${NC}"
    else
        echo -e "${RED}✗ Failed to restart containers${NC}"
        exit 1
    fi
}

# Function to reset everything
reset_all() {
    echo ""
    echo -e "${RED}WARNING: This will remove all containers AND data!${NC}"
    read -p "Are you absolutely sure? (yes/no) " -r
    echo
    if [[ $REPLY == "yes" ]]; then
        docker-compose down -v
        echo -e "${GREEN}✓ Everything removed successfully!${NC}"
    else
        echo -e "${YELLOW}Operation cancelled${NC}"
    fi
}

# Main menu
show_menu() {
    echo ""
    echo -e "${GREEN}What would you like to do?${NC}"
    echo "1) Start containers"
    echo "2) Stop containers"
    echo "3) Restart containers"
    echo "4) View logs"
    echo "5) Show status"
    echo "6) Remove containers (keep data)"
    echo "7) Reset everything (remove data)"
    echo "8) Exit"
    echo ""
    read -p "Enter your choice [1-8]: " choice
    
    case $choice in
        1) start_containers ;;
        2) stop_containers ;;
        3) restart_containers ;;
        4) view_logs ;;
        5) show_status ;;
        6) remove_containers ;;
        7) reset_all ;;
        8) 
            echo -e "${GREEN}Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            ;;
    esac
    
    # Show menu again
    show_menu
}

# Main execution
check_docker
show_menu