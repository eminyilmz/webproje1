# Lumina AI 🎨

Lumina AI is a powerful, production-ready AI photo editing platform built with a modern stack. It features a sleek glassmorphism UI, a robust Python backend for image processing, and a scalable worker-based architecture for handling heavy AI tasks.

![Lumina AI Banner](https://via.placeholder.com/1200x400?text=Lumina+AI+Photo+Editor)

## 🚀 Features

- **Professional AI Editing**: Advanced filters and AI-driven enhancements.
- **Real-time Preview**: Fast processing with instant feedback.
- **Scalable Architecture**: Decoupled frontend and backend with Celery workers.
- **Dockerized Setup**: Easy deployment anywhere with Docker Compose.
- **Modern UI**: Built with Next.js 15, Tailwind CSS, and Framer Motion.

## 🛠️ Tech Stack

- **Frontend**: [Next.js 15](https://nextjs.org/), [React](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend**: [FastAPI](https://fastapi.tiangolo.com/), [Python 3.12](https://www.python.org/)
- **Processing**: [Celery](https://docs.celeryq.dev/), [Redis](https://redis.io/)
- **Infrastructure**: [Docker](https://www.docker.com/), [Nginx](https://www.nginx.com/)

---

## 🏗️ Getting Started

### Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/lumina-ai.git
   cd lumina-ai
   ```

2. **Set up environment variables:**
   - Copy `.env.example` in both `frontend` and `backend` (if customization is needed).

3. **Spin up the containers:**
   ```bash
   docker-compose up --build
   ```

4. **Access the application:**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8000`

---

## 📁 Project Structure

```text
lumina-ai/
├── frontend/        # Next.js Application
├── backend/         # FastAPI & AI Logic
│   ├── utils/       # Image processing utilities
│   └── worker.py    # Celery worker tasks
├── docker-compose.yml
└── nginx.conf       # Reverse proxy configuration
```

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.
