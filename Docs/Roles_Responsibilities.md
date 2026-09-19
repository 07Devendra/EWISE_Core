# Team Roles & Responsibilities

The project is divided into five distinct engineering domains to ensure technical rigor across all aspects of the system.

#### 1. Devendra Patil — Team Lead, Core Architect & Backend/ML Integration Lead

**Role:** Acts as the overarching team lead and core system architect, while managing the server-side infrastructure, hardware integration, and AI deployment.

**Responsibilities:**
- Serves as the Team Lead, coordinating efforts across all engineering domains, guiding project direction, and ensuring milestones are met.
- Architects the core system infrastructure, ensuring seamless integration between frontend, backend, database, ML, and hardware components.
- Develops the backend web server (e.g., using FastAPI or Flask) to handle API requests and business logic.
- Writes the hardware integration scripts to capture data from the digital scale and stream the live camera feed.
- Integrates the trained YOLO object-detection model into the backend for real-time inference.
- Programs the core routing logic (e.g., triggering the disassembly prompt when whole devices are detected).

#### 2. Vedant Patil — Frontend Engineer & Product Presentation Lead

**Role:** Owns the user interface, kiosk experience, and final product polish.

**Responsibilities:**
- Builds the web application and dashboard architecture.
- Integrates the live video stream and system state overlays (loading screens, auto-trigger notifications).
- Designs the step-by-step UI workflow, including the disassembly alerts and color-coded bin routing instructions.
- Manages the final presentation layer, ensuring the application is responsive, accessible, and visually professional for end-users and evaluators.

#### 3. Sumit Kumbhar — Data Analytics & LCA Lead

**Role:** Owns the environmental calculations and data visualization modules.

**Responsibilities:**
- Develops the Life Cycle Assessment (LCA) Python algorithms to dynamically calculate carbon offsets based on component weight and material makeup.
- Constructs the mathematical logic for real-time bin capacity tracking and threshold alerts.
- Builds the interactive charts (e.g., material yield pie charts, carbon offset time-series graphs) for the Admin Dashboard, assisting Vedant Patil.

#### 4. Summit Pawar — Dataset Engineering & QA Lead

**Role:** Owns the computer vision training data and model accuracy.

**Responsibilities:**
- Collects and curates a diverse image dataset of intact and disassembled campus e-waste.
- Annotates images (drawing bounding boxes) and applies data augmentation techniques to simulate varied lighting and angles.
- Trains the YOLO object-detection model and fine-tunes hyperparameters.
- Conducts rigorous Quality Assurance (QA) testing on the model to minimize false positives and maximize detection confidence.

#### 5. Ritesh Jadhav — Database & Domain Data Engineer

**Role:** Owns the data architecture and real-world environmental research.

**Responsibilities:**
- Architects the SQL database schema (creating tables and relationships for Objects, Materials, Logistics, and Historical Records).
- Creates and implements the SQL databases based on the architected schema, setting up the tables, keys, and constraints in SQLite.
- Researches industry-standard Life Cycle Assessment databases to determine the average material mass fractions of e-waste components (e.g., % of copper in a standard PCB).
- Sources valid scientific Carbon Emission Factors to feed into the LCA calculations.
- Defines and inputs the real-world logistics parameters, such as the weight thresholds required by specialized recycling vendors.