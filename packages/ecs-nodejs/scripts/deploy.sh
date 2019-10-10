aws ecr get-login --no-include-email --region us-east-1 --profile prod | /bin/bash
docker build -t cloud-frontend .
docker tag cloud-frontend:latest 183630990214.dkr.ecr.us-east-1.amazonaws.com/cloud-frontend:latest
docker push 183630990214.dkr.ecr.us-east-1.amazonaws.com/cloud-frontend:latest
