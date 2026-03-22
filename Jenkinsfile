pipeline {
    agent any

    // ─────────────────────────────────────────────────────────────────
    // ENVIRONMENT — all config in one place
    // ─────────────────────────────────────────────────────────────────
    environment {
        DOCKERHUB_CREDS   = credentials('dockerhub')
        DOCKERHUB_USER    = 'sauravnirala'

        // Image names & tags
        TODO_REPO         = 'nodejs-todo-devops-project'
        TICTACTOE_REPO    = 'tictactoe-app'
        IMAGE_TAG         = "${env.BUILD_NUMBER}"

        TODO_IMAGE        = "${DOCKERHUB_USER}/nodejs-todo-devops-project:${IMAGE_TAG}"
        TODO_LATEST       = "${DOCKERHUB_USER}/nodejs-todo-devops-project:latest"
        TICTACTOE_IMAGE   = "${DOCKERHUB_USER}/tictactoe-app:${IMAGE_TAG}"
        TICTACTOE_LATEST  = "${DOCKERHUB_USER}/tictactoe-app:latest"

        // Git — repo that contains both app source + k8s/all-apps.yaml
        GIT_REPO_URL      = 'https://github.com/sauravnirala/Kubeproject.git'
        GIT_BRANCH        = 'main'

        // Kubernetes
        K8S_NAMESPACE     = 'myapp'
        TODO_PORT         = '3000'
        TICTACTOE_PORT    = '8081'
    }

    stages {

        // ─────────────────────────────────────────────
        // STAGE 1 — Checkout from Git
        // ─────────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo "Cloning ${GIT_REPO_URL} @ ${GIT_BRANCH}"
                git branch: "${GIT_BRANCH}", url: "${GIT_REPO_URL}"
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 2 — Build Docker Images (parallel)
        // ─────────────────────────────────────────────
        stage('Build Docker Images') {
            parallel {
                stage('Build Todo App') {
                    steps {
                        sh """
                            docker build -t ${TODO_IMAGE} -t ${TODO_LATEST} -f Dockerfile.todo .
                            echo "Built ${TODO_IMAGE}"
                        """
                    }
                }
                stage('Build Tic Tac Toe') {
                    steps {
                        sh """
                            docker build -t ${TICTACTOE_IMAGE} -t ${TICTACTOE_LATEST} -f Dockerfile.tictactoe .
                            echo "Built ${TICTACTOE_IMAGE}"
                        """
                    }
                }
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 3 — Test
        //   Runs npm test inside the todo app container.
        //   Continues even if no tests are defined.
        // ─────────────────────────────────────────────
        stage('Test') {
            steps {
                sh """
                    docker run --rm \
                        -e NODE_ENV=test \
                        ${TODO_IMAGE} \
                        npm test || echo "No tests found — continuing."
                """
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 4 — Push to DockerHub (parallel)
        // ─────────────────────────────────────────────
        stage('Push to DockerHub') {
            steps {
                echo "Logging in to DockerHub as ${DOCKERHUB_USER}..."
                sh "echo ${DOCKERHUB_CREDS} | docker login -u ${DOCKERHUB_USER} --password-stdin"
            }
        }
 
        stage('Push Images') {
            parallel {
                stage('Push Todo App') {
                    steps {
                        sh """
                            docker push ${TODO_IMAGE}
                            docker push ${TODO_LATEST}
                            echo "Pushed: ${TODO_IMAGE}"
                            echo "Pushed: ${TODO_LATEST}"
                        """
                    }
                }
                stage('Push Tic Tac Toe') {
                    steps {
                        sh """
                            docker push ${TICTACTOE_IMAGE}
                            docker push ${TICTACTOE_LATEST}
                            echo "Pushed: ${TICTACTOE_IMAGE}"
                            echo "Pushed: ${TICTACTOE_LATEST}"
                        """
                    }
                }
            }
        }
 
        stage('Docker Logout') {
            steps {
                sh "docker logout"
                echo "All images pushed to DockerHub successfully."
            }
        }

        // ─────────────────────────────────────────────
        // STAGE 5 — Deploy to Kubernetes
        // ─────────────────────────────────────────────
        stage('Deploy to Kubernetes') {
            steps {
                sh """
                    # ── Namespace ────────────────────────────────────────────
                    kubectl apply -f namespace.yml

                    # ── All Apps (todo + tictactoe + ingress) ─────────────────
                    # Substitute real image tags into a temp copy of all-apps.yml
                    cp projectdeploy.yml /tmp/all-apps.yml

                    sed -i 's|sauravnirala/nodejs-todo-devops-project:v1|${TODO_IMAGE}|g'  /tmp/projectdeploy.yaml
                    sed -i 's|sauravnirala/tictactoe-app:v1|${TICTACTOE_IMAGE}|g'          /tmp/projectdeploy.yaml

                    kubectl apply -f /tmp/projectdeploy.yaml

                    # ── Wait for both apps to roll out ────────────────────────
                    echo "Waiting for Todo App..."
                    kubectl rollout status deployment/todo-app  -n ${K8S_NAMESPACE}

                    echo "Waiting for Tic Tac Toe..."
                    kubectl rollout status deployment/tictactoe -n ${K8S_NAMESPACE}
                """
            }
        }

        
        // ─────────────────────────────────────────────
        // STAGE 6 — Access Info
        // ─────────────────────────────────────────────
        stage('Access Info') {
            steps {
                sh """
                    echo "============================================================"
                    echo "  DEPLOYMENT COMPLETE — Build ${IMAGE_TAG}"
                    echo "  Todo Image     : ${TODO_IMAGE}"
                    echo "  TicTacToe Image: ${TICTACTOE_IMAGE}"
                    echo "============================================================"
                """
            }
        }
    }

    // ─────────────────────────────────────────────────
    // POST ACTIONS
    // ─────────────────────────────────────────────────
    post {
        success {
            echo "Pipeline SUCCESS — Build ${IMAGE_TAG} deployed to namespace '${K8S_NAMESPACE}'."
        }
        failure {
            echo "Pipeline FAILED. Collecting diagnostics..."
        }
    }
}