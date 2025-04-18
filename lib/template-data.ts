export const templateData = [
  {
    id: "auth-github",
    name: "GitHub OAuth Authentication",
    description: "A template for implementing GitHub OAuth authentication in your application",
    category: "Authentication",
    tags: ["oauth", "github", "authentication", "security"],
    author: "John Doe",
    updatedAt: "2023-11-15",
    usageCount: 342,
    isFavorite: true,
    planningMd: `# Feature: GitHub OAuth Authentication

## Goals
- Provide secure authentication using GitHub credentials
- Simplify the login process for developers
- Retrieve basic GitHub profile information

## Background
Many users of our application already have GitHub accounts and prefer not to create yet another set of credentials. GitHub OAuth allows users to authenticate using their existing GitHub accounts.

## Purpose
The purpose of this feature is to streamline the authentication process and reduce friction for new user signups, particularly for developer-focused applications.

## Target Audience
Software developers and technical users who already have GitHub accounts.

## Technical Considerations
- GitHub OAuth API requirements and rate limits
- Secure storage of access tokens
- Handling of authentication state
- Refresh token strategy

## Dependencies
- GitHub Developer Application registration
- Environment variables for GitHub Client ID and Secret
- Secure session management
`,
    taskMd: `# Implementation Tasks

## Phase 1: Setup & Configuration
- [ ] Register a new OAuth application in GitHub Developer settings
- [ ] Configure environment variables for GitHub Client ID and Secret
- [ ] Set up authentication routes and handlers
- [ ] Implement secure session management

## Phase 2: Authentication Flow
- [ ] Create GitHub OAuth authorization URL generator
- [ ] Implement OAuth callback handler
- [ ] Add token exchange functionality
- [ ] Store authentication tokens securely
- [ ] Implement user profile retrieval from GitHub API

## Phase 3: User Experience
- [ ] Design and implement login button/flow
- [ ] Create loading states during authentication
- [ ] Handle authentication errors gracefully
- [ ] Add logout functionality
- [ ] Implement session persistence

## Phase 4: Testing & Security
- [ ] Test the complete authentication flow
- [ ] Implement CSRF protection
- [ ] Add rate limiting for authentication attempts
- [ ] Test error scenarios and edge cases
- [ ] Conduct security review of implementation
`,
  },
  {
    id: "dashboard-analytics",
    name: "Analytics Dashboard",
    description: "A template for creating data visualization dashboards with charts and metrics",
    category: "Dashboard",
    tags: ["analytics", "charts", "data-visualization", "metrics"],
    author: "Jane Smith",
    updatedAt: "2023-12-02",
    usageCount: 187,
    planningMd: `# Feature: Analytics Dashboard

## Goals
- Provide users with visual insights into their data
- Display key performance indicators and metrics
- Enable data-driven decision making

## Background
Users need a centralized place to view and analyze their data. An analytics dashboard provides visual representations of complex data sets, making it easier to identify trends and patterns.

## Purpose
The purpose of this feature is to help users understand their data through visual representations and interactive elements, enabling them to make informed decisions.

## Target Audience
Product managers, business analysts, and stakeholders who need to monitor performance metrics.

## Technical Considerations
- Data fetching and aggregation
- Chart rendering performance
- Responsive design for different screen sizes
- Real-time updates vs. cached data

## Dependencies
- Data sources and APIs
- Charting library
- Date/time handling utilities
`,
    taskMd: `# Implementation Tasks

## Phase 1: Design & Planning
- [ ] Define key metrics and visualizations
- [ ] Create wireframes for dashboard layout
- [ ] Select appropriate chart types for each metric
- [ ] Plan data fetching strategy

## Phase 2: Data Integration
- [ ] Set up data fetching from relevant APIs
- [ ] Implement data transformation and aggregation
- [ ] Create caching mechanism for performance
- [ ] Add error handling for data loading failures

## Phase 3: UI Implementation
- [ ] Implement dashboard layout and container
- [ ] Add chart components for each metric
- [ ] Create metric cards for KPIs
- [ ] Implement date range selector
- [ ] Add loading states and skeletons

## Phase 4: Interactivity & Polish
- [ ] Add filtering capabilities
- [ ] Implement drill-down functionality
- [ ] Add tooltips and hover states
- [ ] Optimize for mobile devices
- [ ] Add export functionality for reports
`,
  },
  {
    id: "rest-api",
    name: "RESTful API Endpoints",
    description: "A template for designing and implementing RESTful API endpoints",
    category: "API",
    tags: ["rest", "api", "endpoints", "backend"],
    author: "Alex Johnson",
    updatedAt: "2024-01-10",
    usageCount: 256,
    planningMd: `# Feature: RESTful API Endpoints

## Goals
- Create consistent and well-documented API endpoints
- Follow REST best practices
- Provide secure and efficient data access

## Background
A well-designed API is crucial for enabling integrations and providing data access to frontend applications. RESTful APIs provide a standardized approach to creating endpoints that are intuitive and easy to use.

## Purpose
The purpose of this feature is to establish a consistent pattern for API endpoints that can be used across the application, ensuring maintainability and ease of use.

## Target Audience
Developers who will consume the API, including frontend developers and third-party integrators.

## Technical Considerations
- Authentication and authorization
- Rate limiting and throttling
- Error handling and status codes
- Versioning strategy
- Documentation standards

## Dependencies
- Database models and schemas
- Authentication system
- Validation libraries
`,
    taskMd: `# Implementation Tasks

## Phase 1: API Design
- [ ] Define resource models and relationships
- [ ] Plan endpoint URLs and HTTP methods
- [ ] Design request/response formats
- [ ] Create OpenAPI/Swagger documentation
- [ ] Define error codes and messages

## Phase 2: Core Implementation
- [ ] Set up API router and middleware
- [ ] Implement authentication middleware
- [ ] Create CRUD endpoints for primary resources
- [ ] Add validation for request payloads
- [ ] Implement error handling

## Phase 3: Advanced Features
- [ ] Add filtering, sorting, and pagination
- [ ] Implement rate limiting
- [ ] Add caching headers
- [ ] Create relationship endpoints
- [ ] Implement bulk operations where needed

## Phase 4: Testing & Documentation
- [ ] Write unit tests for each endpoint
- [ ] Create integration tests for API flows
- [ ] Generate API documentation
- [ ] Create example requests and responses
- [ ] Test with actual frontend integration
`,
  },
  {
    id: "dark-mode",
    name: "Dark Mode Support",
    description: "A template for adding dark mode support to your application",
    category: "UI",
    tags: ["dark-mode", "theme", "accessibility", "ui"],
    author: "Sam Wilson",
    updatedAt: "2023-10-25",
    usageCount: 421,
    isFavorite: true,
    planningMd: `# Feature: Dark Mode Support

## Goals
- Provide users with a dark theme option
- Improve accessibility and reduce eye strain
- Support system preference detection

## Background
Dark mode has become a standard feature in modern applications. It helps reduce eye strain in low-light environments and can save battery life on OLED screens. Many users prefer dark themes for aesthetic reasons as well.

## Purpose
The purpose of this feature is to enhance user experience by providing a dark theme option that respects user preferences and improves accessibility.

## Target Audience
All users, particularly those who work in low-light environments or have sensitivity to bright screens.

## Technical Considerations
- Theme switching mechanism
- Persistent theme preference
- System preference detection
- Color palette design for both themes

## Dependencies
- CSS variables or theme system
- Local storage for preference persistence
- Media query detection for system preferences
`,
    taskMd: `# Implementation Tasks

## Phase 1: Design System
- [ ] Create color palette for dark theme
- [ ] Define CSS variables for theme-dependent colors
- [ ] Audit existing UI components for theme compatibility
- [ ] Design toggle component for theme switching

## Phase 2: Implementation
- [ ] Set up theme context/provider
- [ ] Implement theme switching logic
- [ ] Add system preference detection
- [ ] Create persistent storage for theme preference
- [ ] Apply theme variables to global styles

## Phase 3: Component Updates
- [ ] Update primary UI components for theme support
- [ ] Add dark mode styles for forms and inputs
- [ ] Ensure proper contrast ratios for accessibility
- [ ] Update icons and images for dark mode
- [ ] Test all components in both themes

## Phase 4: Polish & Testing
- [ ] Add smooth transition between themes
- [ ] Test across different browsers and devices
- [ ] Ensure no flickering on initial load
- [ ] Verify accessibility with screen readers
- [ ] Add theme toggle to user preferences
`,
  },
  {
    id: "file-upload",
    name: "File Upload System",
    description: "A template for implementing secure file uploads with progress tracking",
    category: "Integration",
    tags: ["file-upload", "storage", "media", "cloud"],
    author: "Taylor Reed",
    updatedAt: "2024-02-05",
    usageCount: 134,
    planningMd: `# Feature: File Upload System

## Goals
- Enable secure file uploads for users
- Support multiple file types and sizes
- Provide progress tracking and status updates

## Background
Many applications require the ability to upload and manage files, such as images, documents, or media. A robust file upload system is essential for handling these operations securely and efficiently.

## Purpose
The purpose of this feature is to provide users with a reliable way to upload files to the application, with appropriate feedback and error handling.

## Target Audience
Users who need to share content, upload documents, or manage media within the application.

## Technical Considerations
- File size limits and validation
- Supported file types
- Storage options (local vs. cloud)
- Security and virus scanning
- Progress tracking and cancellation

## Dependencies
- Storage provider (S3, Azure, etc.)
- File processing libraries
- MIME type detection
`,
    taskMd: `# Implementation Tasks

## Phase 1: Backend Setup
- [ ] Configure storage provider and credentials
- [ ] Create upload endpoint with multipart support
- [ ] Implement file validation and sanitization
- [ ] Add virus scanning integration
- [ ] Set up file metadata storage

## Phase 2: Frontend Implementation
- [ ] Create drag-and-drop upload zone
- [ ] Implement file selection dialog
- [ ] Add file type and size validation
- [ ] Create progress indicator component
- [ ] Implement cancel upload functionality

## Phase 3: Advanced Features
- [ ] Add chunked upload support for large files
- [ ] Implement resume functionality for interrupted uploads
- [ ] Create file preview generation
- [ ] Add image optimization for uploaded images
- [ ] Implement file organization system

## Phase 4: Testing & Security
- [ ] Test with various file types and sizes
- [ ] Verify error handling for invalid files
- [ ] Test concurrent uploads
- [ ] Implement proper access controls
- [ ] Add rate limiting for upload endpoints
`,
  },
  {
    id: "search-functionality",
    name: "Search Functionality",
    description: "A template for implementing robust search capabilities in your application",
    category: "Data",
    tags: ["search", "filtering", "indexing", "data"],
    author: "Jordan Lee",
    updatedAt: "2023-11-30",
    usageCount: 198,
    planningMd: `# Feature: Search Functionality

## Goals
- Provide fast and accurate search capabilities
- Support filtering and advanced search options
- Deliver relevant results with ranking

## Background
Effective search functionality is critical for applications with large amounts of content or data. Users expect to quickly find what they're looking for with minimal effort.

## Purpose
The purpose of this feature is to enable users to efficiently locate information or items within the application through keyword searches and filters.

## Target Audience
All users who need to find specific content or data within the application.

## Technical Considerations
- Search indexing strategy
- Query parsing and optimization
- Result ranking and relevance
- Performance for large datasets
- Typo tolerance and suggestions

## Dependencies
- Search engine or library
- Database indexing
- Text processing utilities
`,
    taskMd: `# Implementation Tasks

## Phase 1: Search Infrastructure
- [ ] Select appropriate search technology (Elasticsearch, Algolia, etc.)
- [ ] Set up search indices and mappings
- [ ] Implement data synchronization with search indices
- [ ] Create basic search query functionality
- [ ] Test search performance with sample data

## Phase 2: Search UI
- [ ] Design search input and results components
- [ ] Implement search bar with suggestions
- [ ] Create results display with pagination
- [ ] Add loading states and error handling
- [ ] Implement keyboard navigation for results

## Phase 3: Advanced Features
- [ ] Add filters and faceted search
- [ ] Implement highlighting of matched terms
- [ ] Add typo tolerance and suggestions
- [ ] Create advanced search syntax support
- [ ] Implement search analytics and tracking

## Phase 4: Optimization & Polish
- [ ] Optimize query performance
- [ ] Improve result ranking and relevance
- [ ] Add search history and saved searches
- [ ] Implement debouncing for search input
- [ ] Add empty state and no-results handling
`,
  },
]
