# Email Assistant PRD Generation Prompt

Create a comprehensive Product Requirements Document (PRD) for an Intelligent Email Assistant with the following specifications:

## Core Product Vision
Develop an AI-powered email management platform that combines email processing, calendar management, form automation, and multi-channel communication capabilities with advanced vector search and voice integration.

## AI Model Strategy

### Desktop Applications
- **Primary Model**: GPT-OSS 20B deployed on cloud infrastructure
- **Use Cases**: Complex reasoning, detailed email analysis, sophisticated response generation
- **Deployment**: Cloud-based with API integration
- **Performance**: High-accuracy processing for desktop workflows

### Mobile Applications
- **Primary Models**: 
  - Gemma 3: 4B for general mobile operations
  - Gemma 3: 270M fine-tuned specifically for customer support scenarios
- **Use Cases**: On-device processing, quick responses, offline capabilities
- **Deployment**: Edge deployment with cloud fallback
- **Performance**: Optimized for mobile hardware constraints

### Audio Processing
- **Platform**: ElevenLabs cloud-based audio management
- **Capabilities**: High-quality TTS, voice cloning, multi-language support
- **Integration**: Real-time audio processing for voice features

## Technical Requirements & Features

### 1. User Interface Architecture
- **Desktop Application**: Three-panel layout
  - Left Panel: Email list view with filtering/sorting
  - Middle Panel: Full email content display with rich formatting
  - Right Panel: AI chat interface and email composition
- **Mobile Application**: Responsive design with collapsible panels
- **Web Application**: Browser-based version with identical functionality

### 2. Authentication & Email Integration
- Multi-provider email authentication (Gmail, Outlook, IMAP/SMTP)
- OAuth 2.0 secure authentication flow
- Real-time email synchronization
- Offline capability with sync when reconnected

### 3. Vector Database & AI Processing
- Graph vector database for email storage and retrieval
- Automatic vectorization of incoming emails
- Manual vectorization trigger button in UI
- Context-aware email understanding and categorization
- Semantic search across email history
- Model-specific processing pipelines (GPT-OSS 20B for desktop, Gemma 3 for mobile)

### 4. Calendar Management
- Integrated calendar view and management
- Meeting scheduling from email content
- Calendar event creation and modification
- Conflict detection and resolution suggestions

### 5. Form Automation
- Intelligent form detection in emails
- Automated form filling using context and preferences
- Form template creation and management
- Validation and error handling

### 6. AI Response Generation
- Context-aware email responses using vector storage
- Tone and style adaptation based on sender/context
- Draft generation with human review workflow
- Template-based and freeform response options
- Platform-optimized processing (desktop vs mobile models)

### 7. Slack Integration
- Two-way Slack connectivity
- Email-to-Slack message posting
- Slack thread monitoring and response
- Channel-specific routing rules

### 8. Reminder & Task Management
- Smart reminder extraction from emails
- Follow-up scheduling and tracking
- Task creation from email content
- Deadline monitoring and alerts

### 9. Internet Search Integration
- DuckDuckGo MCP for web search capabilities
- Contextual search based on email content
- Search results integration in responses
- Fact-checking and information verification

### 10. Voice & Phone Integration
- **ASR (Automatic Speech Recognition)**: Built-in speech-to-text
- **TTS (Text-to-Speech)**: ElevenLabs voice email reading
- **Phone Integration**: Voice call capabilities via:
  - n8n workflow automation
  - ElevenLabs for high-quality voice synthesis
  - Deepgram for advanced speech recognition
- Voice commands for email management
- Dictated email composition and responses

## Technical Stack Requirements

### AI/ML Infrastructure
- **Desktop**: GPT-OSS 20B cloud deployment with high-performance API
- **Mobile**: Gemma 3 models (4B general, 270M customer support fine-tuned)
- **Audio**: ElevenLabs cloud platform for all audio processing
- **Vector DB**: Pinecone, Weaviate, or Chroma for semantic search

### Application Stack
- **Frontend**: Cross-platform framework (Electron for desktop, React Native/Flutter for mobile)
- **Backend**: Node.js/Python with MCP server architecture
- **Automation**: n8n for workflow orchestration
- **Search**: DuckDuckGo MCP integration

### Performance Considerations
- **Desktop**: Leverage cloud compute for complex AI operations
- **Mobile**: Hybrid approach with local models + cloud fallback
- **Audio**: Real-time processing with ElevenLabs streaming
- **Caching**: Smart caching strategies for model responses

## Deliverables Needed

### 1. Comprehensive PRD Document
- Market analysis and competitive landscape
- User personas and use cases
- Feature specifications with acceptance criteria
- Technical architecture diagrams with AI model deployment
- Data flow and security considerations
- Privacy and compliance requirements (GDPR, CCPA)
- Model performance benchmarks and requirements

### 2. Implementation Roadmap
- Phase-based development plan with AI model integration milestones
- MVP feature set definition
- Development milestones and timelines
- Resource requirements and team structure
- AI model training and deployment schedule

### 3. Task Lists & Project Management
- Epic breakdown with user stories
- Technical tasks and dependencies
- AI model integration tasks
- QA and testing requirements including model performance testing
- Deployment and DevOps considerations

### 4. Research Requirements
- Competitive analysis using Firecrawl web scraping
- AI model performance evaluation and benchmarking
- Technology stack evaluation
- Integration feasibility studies
- Security and privacy assessment for AI model usage

### 5. AI Model Specifications
- Detailed requirements for GPT-OSS 20B cloud deployment
- Gemma 3 model optimization and fine-tuning specifications
- ElevenLabs integration architecture
- Performance benchmarks and SLA requirements
- Cost analysis for different model usage patterns

Please create a detailed PRD that covers all these aspects, includes comprehensive task lists, provides implementation timelines, and addresses technical feasibility, security considerations, AI model deployment strategies, and user experience design. The document should be suitable for engineering teams, product managers, and stakeholders to understand scope, requirements, and implementation approach with specific focus on the multi-model AI architecture.