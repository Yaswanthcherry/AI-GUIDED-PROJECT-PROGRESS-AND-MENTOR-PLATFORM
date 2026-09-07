import streamlit as st
import time

# Page configuration
st.set_page_config(page_title="AI Academic Project Mentor", page_icon="🎓", layout="wide")

# Custom CSS for a clean, academic, and modern UI
st.markdown("""
    <style>
    .main-header { font-size: 2.5rem; font-weight: bold; color: #2563EB; text-align: center; margin-bottom: 0.5rem; }
    .sub-header { font-size: 1.1rem; color: #64748B; text-align: center; margin-bottom: 2rem; }
    .stTabs [data-baseweb="tab-list"] { gap: 10px; }
    .stTabs [data-baseweb="tab"] { height: 50px; padding-left: 20px; padding-right: 20px; border-radius: 8px 8px 0 0; }
    </style>
""", unsafe_allow_html=True)

# Initialize session state
if "blueprint_generated" not in st.session_state:
    st.session_state.blueprint_generated = False
if "chat_history" not in st.session_state:
    st.session_state.chat_history = [
        {"role": "assistant", "content": "Hello! I'm your AI Academic Project Mentor. Enter your project idea below, and I'll help you build a complete blueprint!"}
    ]

def generate_blueprint(idea):
    """Simulates the AI Orchestrator calling the specialized agents from your Colab"""
    with st.spinner("🤖 AI Orchestrator is analyzing your idea and consulting specialized agents..."):
        time.sleep(2.5) # Simulate API/Agent processing time
        
        # Mock data structured exactly as your AAPM notes define
        st.session_state.blueprint = {
            "idea_evaluation": {
                "feasibility": "High", "difficulty": "Medium", "innovation": "High",
                "duration": "6 Weeks",
                "recommendation": "Proceed with project. The scope is well-defined and achievable within an academic timeline."
            },
            "scope": {
                "objectives": ["Develop an AI chatbot capable of answering customer queries using RAG.", "Implement a user-friendly interface.", "Ensure data privacy and secure handling."],
                "deliverables": ["Working Chatbot Prototype", "Complete Project Documentation", "Presentation Slides (PPT)"],
                "functional_req": ["Process natural language queries", "Retrieve relevant info from knowledge base", "Generate coherent responses"],
                "non_functional_req": ["Response time under 2 seconds", "99% uptime during demo", "Scalable architecture"]
            },
            "tech_stack": {
                "Frontend": "Streamlit / React",
                "Backend": "FastAPI / Flask",
                "AI/ML": "OpenAI API / Hugging Face / LangChain",
                "Database": "MongoDB / PostgreSQL",
                "Deployment": "Docker / AWS"
            },
            "timeline": [
                {"week": 1, "task": "Problem Identification & Requirement Gathering"},
                {"week": 2, "task": "Literature Survey & Architecture Design"},
                {"week": 3, "task": "Initial Development & Setup"},
                {"week": 4, "task": "Core Feature Development"},
                {"week": 5, "task": "Testing & Debugging"},
                {"week": 6, "task": "Documentation & Final Deployment"}
            ],
            "risks": [
                {"risk": "Dataset unavailable", "solution": "Use Kaggle datasets or synthetic data generation."},
                {"risk": "API cost", "solution": "Use Hugging Face open-source models or free tier APIs."},
                {"risk": "Deployment failure", "solution": "Deploy using Docker containers for environment consistency."}
            ],
            "documentation": [
                "Synopsis", "Abstract", "Literature Review", "Objectives", "Problem Statement", 
                "System Architecture", "UML Diagrams", "Flowcharts", "Final Report", "Presentation (PPT)", "User Manual"
            ]
        }
        st.session_state.blueprint_generated = True

# ================= MAIN UI =================
st.markdown('<div class="main-header">🎓 AI Academic Project Mentor (AAPM)</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-header">Your Intelligent AI Guide from Project Idea to Final Submission</div>', unsafe_allow_html=True)

# Sidebar: Progress Tracking (Progress Tracking Agent)
with st.sidebar:
    st.header("📊 Student Dashboard")
    st.markdown("**Current Phase:** Idea Generation")
    st.progress(15)
    st.markdown("""
    - [x] Idea Submission
    - [ ] Blueprint Approval
    - [ ] Development Phase
    - [ ] Documentation Generation
    - [ ] Final Submission
    """)
    st.divider()
    st.info("💡 **Tip:** Be specific in your project idea (mention domain, goal, and preferred tech if any) for better recommendations!")

# Main Input Area
st.markdown("### 💡 Enter Your Project Idea")
project_idea = st.text_area(
    "Describe your project in 2–3 lines:",
    placeholder="Example: I want to build an AI-powered customer support chatbot using Generative AI and Retrieval-Augmented Generation (RAG).",
    height=100
)

col1, col2, col3 = st.columns([1, 1, 1])
with col2:
    if st.button("🚀 Generate Project Blueprint", type="primary", use_container_width=True):
        if project_idea.strip():
            generate_blueprint(project_idea)
        else:
            st.warning("Please enter a project idea first.")

# Display Blueprint Results
if st.session_state.blueprint_generated:
    st.success("✅ Project Blueprint Generated Successfully!")
    st.markdown("---")
    
    # Tabs for different agent outputs (Overall Architecture)
    tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
        "🔍 Idea Evaluation", "🎯 Scope", "💻 Tech Stack", "📅 Timeline", "⚠️ Risks", "📄 Documentation"
    ])
    
    with tab1:
        st.subheader("Idea Evaluation Agent")
        eval_data = st.session_state.blueprint["idea_evaluation"]
        c1, c2, c3, c4 = st.columns(4)
        c1.metric("Feasibility", eval_data["feasibility"])
        c2.metric("Difficulty", eval_data["difficulty"])
        c3.metric("Innovation", eval_data["innovation"])
        c4.metric("Duration", eval_data["duration"])
        st.info(f"**Recommendation:** {eval_data['recommendation']}")

    with tab2:
        st.subheader("Scope Definition Agent")
        scope = st.session_state.blueprint["scope"]
        st.markdown("**🎯 Objectives:**")
        for obj in scope["objectives"]: st.markdown(f"- {obj}")
        st.markdown("**📦 Deliverables:**")
        for dev in scope["deliverables"]: st.markdown(f"- {dev}")
        st.markdown("**⚙️ Functional Requirements:**")
        for req in scope["functional_req"]: st.markdown(f"- {req}")
        st.markdown("**🛡️ Non-Functional Requirements:**")
        for req in scope["non_functional_req"]: st.markdown(f"- {req}")

    with tab3:
        st.subheader("Technology Recommendation Agent")
        tech = st.session_state.blueprint["tech_stack"]
        for key, value in tech.items():
            st.markdown(f"**{key}:** `{value}`")

    with tab4:
        st.subheader("Timeline Planning Agent")
        for item in st.session_state.blueprint["timeline"]:
            st.markdown(f"**Week {item['week']}:** {item['task']}")

    with tab5:
        st.subheader("Risk Assessment Agent")
        for item in st.session_state.blueprint["risks"]:
            st.markdown(f"**⚠️ Risk:** {item['risk']}  \n**✅ Suggested Solution:** {item['solution']}")
            st.divider()

    with tab6:
        st.subheader("Documentation Agent")
        st.markdown("The following documents will be auto-generated for your project:")
        cols = st.columns(2)
        for i, doc in enumerate(st.session_state.blueprint["documentation"]):
            cols[i % 2].markdown(f"- 📄 {doc}")

    st.markdown("---")
    st.markdown("### 🗨️ Conversational AI Assistant")
    st.markdown("Ask follow-up questions about your blueprint, scope, or technologies.")

# Chat Interface
with st.container():
    chat_container = st.container(height=350)
    with chat_container:
        for message in st.session_state.chat_history:
            with st.chat_message(message["role"]):
                st.markdown(message["content"])
    
    user_input = st.chat_input("Ask a question about your project...")
    if user_input:
        st.session_state.chat_history.append({"role": "user", "content": user_input})
        with st.chat_message("user"):
            st.markdown(user_input)
        
        with st.chat_message("assistant"):
            with st.spinner("Thinking..."):
                time.sleep(1)
                # Placeholder for actual AI agent response
                response = f"That's a great question about *'{user_input}'*. Based on your project blueprint, I recommend focusing on the core requirements first. Would you like me to elaborate on the technology stack or timeline?"
                st.markdown(response)
                st.session_state.chat_history.append({"role": "assistant", "content": response})