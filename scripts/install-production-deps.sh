# Production Dependencies Installation

# Install Redis for production caching (optional)
npm install ioredis

# Install additional production monitoring tools (optional)
npm install @sentry/nextjs           # Error tracking
npm install @vercel/analytics        # Analytics
npm install compression              # Response compression
npm install helmet                   # Security headers

# Development dependencies for production readiness
npm install --save-dev @types/compression

echo "✅ Production dependencies installed!"
echo ""
echo "📋 Next steps:"
echo "1. Configure Redis URL in production environment"
echo "2. Set up error tracking with Sentry"
echo "3. Configure analytics and monitoring"
echo "4. Review security headers configuration"
