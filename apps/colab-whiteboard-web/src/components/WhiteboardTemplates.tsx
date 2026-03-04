import { useState } from "react";
import { Editor, createShapeId } from "tldraw";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  create: (editor: Editor) => void;
}

const templates: Template[] = [
  {
    id: "kanban-board",
    name: "Kanban Board",
    description: "Task management board with To-Do, In Progress, Done columns",
    icon: "📋",
    category: "Project Management",
    create: (editor: Editor) => {
      const columns = [
        { title: "To Do", x: 100, color: "light-blue" },
        { title: "In Progress", x: 400, color: "yellow" },
        { title: "Done", x: 700, color: "light-green" },
      ];

      columns.forEach(({ x, color }) => {
        // Column header
        editor.createShape({
          id: createShapeId(),
          type: "geo",
          x,
          y: 100,
          props: {
            geo: "rectangle",
            w: 250,
            h: 60,
            color: color as any,
            fill: "solid",
          },
        });

        // Sample cards
        [0, 1, 2].forEach((index) => {
          editor.createShape({
            id: createShapeId(),
            type: "note",
            x: x + 10,
            y: 180 + index * 100,
            props: {
              color: color as any,
            },
          });
        });
      });
    },
  },
  {
    id: "flowchart",
    name: "Flowchart",
    description: "Basic flowchart with start, decision, and end nodes",
    icon: "🔄",
    category: "Diagrams",
    create: (editor: Editor) => {
      // Start node
      const startId = createShapeId();
      editor.createShape({
        id: startId,
        type: "geo",
        x: 400,
        y: 100,
        props: {
          geo: "oval",
          w: 150,
          h: 80,
          color: "light-green",
          fill: "solid",
        },
      });

      // Process node
      const processId = createShapeId();
      editor.createShape({
        id: processId,
        type: "geo",
        x: 385,
        y: 230,
        props: {
          geo: "rectangle",
          w: 180,
          h: 80,
          color: "light-blue",
          fill: "solid",
        },
      });

      // Decision node
      const decisionId = createShapeId();
      editor.createShape({
        id: decisionId,
        type: "geo",
        x: 385,
        y: 360,
        props: {
          geo: "diamond",
          w: 180,
          h: 120,
          color: "yellow",
          fill: "solid",
        },
      });

      // End node
      const endId = createShapeId();
      editor.createShape({
        id: endId,
        type: "geo",
        x: 400,
        y: 530,
        props: {
          geo: "oval",
          w: 150,
          h: 80,
          color: "light-red",
          fill: "solid",
        },
      });

      // Arrows - using simpler point-to-point approach
      editor.createShape({
        id: createShapeId(),
        type: "arrow",
        x: 475,
        y: 180,
        props: {
          start: { x: 0, y: 0 },
          end: { x: 0, y: 50 },
        },
      });

      editor.createShape({
        id: createShapeId(),
        type: "arrow",
        x: 475,
        y: 310,
        props: {
          start: { x: 0, y: 0 },
          end: { x: 0, y: 50 },
        },
      });

      editor.createShape({
        id: createShapeId(),
        type: "arrow",
        x: 475,
        y: 480,
        props: {
          start: { x: 0, y: 0 },
          end: { x: 0, y: 50 },
        },
      });
    },
  },
  {
    id: "mind-map",
    name: "Mind Map",
    description: "Central idea with branching thoughts",
    icon: "🧠",
    category: "Brainstorming",
    create: (editor: Editor) => {
      // Central node
      editor.createShape({
        id: createShapeId(),
        type: "geo",
        x: 400,
        y: 300,
        props: {
          geo: "ellipse",
          w: 200,
          h: 120,
          color: "violet",
          fill: "solid",
        },
      });

      // Branch nodes
      const branches = [
        { x: 200, y: 150, color: "light-blue" },
        { x: 650, y: 150, color: "light-green" },
        { x: 200, y: 450, color: "yellow" },
        { x: 650, y: 450, color: "orange" },
      ];

      branches.forEach(({ x, y, color }) => {
        editor.createShape({
          id: createShapeId(),
          type: "geo",
          x,
          y,
          props: {
            geo: "ellipse",
            w: 140,
            h: 80,
            color: color as any,
            fill: "solid",
          },
        });
      });

      // Add connecting lines
      const centerX = 500;
      const centerY = 360;
      branches.forEach(({ x, y }) => {
        editor.createShape({
          id: createShapeId(),
          type: "arrow",
          x: centerX,
          y: centerY,
          props: {
            start: { x: 0, y: 0 },
            end: { x: x + 70 - centerX, y: y + 40 - centerY },
          },
        });
      });
    },
  },
  {
    id: "sticky-notes",
    name: "Sticky Notes Grid",
    description: "Organized grid of sticky notes for brainstorming",
    icon: "📝",
    category: "Brainstorming",
    create: (editor: Editor) => {
      const colors = ["yellow", "light-blue", "light-green", "orange", "light-red", "violet"];
      let index = 0;

      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
          editor.createShape({
            id: createShapeId(),
            type: "note",
            x: 150 + col * 200,
            y: 150 + row * 200,
            props: {
              color: colors[index % colors.length] as any,
            },
          });
          index++;
        }
      }
    },
  },
  {
    id: "swot-analysis",
    name: "SWOT Analysis",
    description: "Strengths, Weaknesses, Opportunities, Threats framework",
    icon: "📊",
    category: "Strategy",
    create: (editor: Editor) => {
      const quadrants = [
        { title: "Strengths", x: 100, y: 100, color: "light-green" },
        { title: "Weaknesses", x: 450, y: 100, color: "light-red" },
        { title: "Opportunities", x: 100, y: 350, color: "light-blue" },
        { title: "Threats", x: 450, y: 350, color: "orange" },
      ];

      quadrants.forEach(({ x, y, color }) => {
        editor.createShape({
          id: createShapeId(),
          type: "geo",
          x,
          y,
          props: {
            geo: "rectangle",
            w: 300,
            h: 200,
            color: color as any,
            fill: "semi",
          },
        });
      });
    },
  },
  {
    id: "wireframe-mobile",
    name: "Mobile Wireframe",
    description: "Basic mobile app screen layout",
    icon: "📱",
    category: "Design",
    create: (editor: Editor) => {
      // Phone frame
      editor.createShape({
        id: createShapeId(),
        type: "geo",
        x: 350,
        y: 80,
        props: {
          geo: "rectangle",
          w: 300,
          h: 550,
          color: "grey",
          fill: "none",
        },
      });

      // Header
      editor.createShape({
        id: createShapeId(),
        type: "geo",
        x: 360,
        y: 90,
        props: {
          geo: "rectangle",
          w: 280,
          h: 60,
          color: "violet",
          fill: "solid",
        },
      });

      // Content blocks
      [0, 1, 2].forEach((index) => {
        editor.createShape({
          id: createShapeId(),
          type: "geo",
          x: 370,
          y: 170 + index * 120,
          props: {
            geo: "rectangle",
            w: 260,
            h: 100,
            color: "light-blue",
            fill: "semi",
          },
        });
      });

      // Button
      editor.createShape({
        id: createShapeId(),
        type: "geo",
        x: 420,
        y: 560,
        props: {
          geo: "rectangle",
          w: 160,
          h: 50,
          color: "light-green",
          fill: "solid",
        },
      });
    },
  },
  {
    id: "timeline",
    name: "Timeline",
    description: "Project timeline with milestones",
    icon: "📅",
    category: "Project Management",
    create: (editor: Editor) => {
      // Timeline line - use arrow for horizontal line
      editor.createShape({
        id: createShapeId(),
        type: "arrow",
        x: 100,
        y: 300,
        props: {
          start: { x: 0, y: 0 },
          end: { x: 700, y: 0 },
        },
      });

      // Milestones
      const milestones = [
        { x: 100, color: "light-blue" },
        { x: 280, color: "light-green" },
        { x: 460, color: "yellow" },
        { x: 640, color: "orange" },
      ];

      milestones.forEach(({ x, color }) => {
        // Milestone marker
        editor.createShape({
          id: createShapeId(),
          type: "geo",
          x,
          y: 280,
          props: {
            geo: "diamond",
            w: 40,
            h: 40,
            color: color as any,
            fill: "solid",
          },
        });
      });
    },
  },
  {
    id: "system-architecture",
    name: "System Architecture",
    description: "Basic system architecture diagram",
    icon: "🏗️",
    category: "Diagrams",
    create: (editor: Editor) => {
      // Client
      editor.createShape({
        id: createShapeId(),
        type: "geo",
        x: 150,
        y: 200,
        props: {
          geo: "rectangle",
          w: 150,
          h: 100,
          color: "light-blue",
          fill: "solid",
        },
      });

      // Server
      editor.createShape({
        id: createShapeId(),
        type: "geo",
        x: 425,
        y: 200,
        props: {
          geo: "rectangle",
          w: 150,
          h: 100,
          color: "light-green",
          fill: "solid",
        },
      });

      // Database
      editor.createShape({
        id: createShapeId(),
        type: "geo",
        x: 700,
        y: 200,
        props: {
          geo: "rectangle",
          w: 150,
          h: 100,
          color: "orange",
          fill: "solid",
        },
      });

      // Arrows - using simple coordinates
      editor.createShape({
        id: createShapeId(),
        type: "arrow",
        x: 300,
        y: 250,
        props: {
          start: { x: 0, y: 0 },
          end: { x: 125, y: 0 },
        },
      });

      editor.createShape({
        id: createShapeId(),
        type: "arrow",
        x: 575,
        y: 250,
        props: {
          start: { x: 0, y: 0 },
          end: { x: 125, y: 0 },
        },
      });
    },
  },
];

interface WhiteboardTemplatesProps {
  editor: Editor | null;
  onTemplateInsert?: () => void;
}

export default function WhiteboardTemplates({ editor, onTemplateInsert }: WhiteboardTemplatesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", ...Array.from(new Set(templates.map((t) => t.category)))];
  const filteredTemplates = selectedCategory === "All" 
    ? templates 
    : templates.filter((t) => t.category === selectedCategory);

  const handleInsertTemplate = (template: Template) => {
    if (!editor) return;
    
    template.create(editor);
    setIsOpen(false);
    onTemplateInsert?.();
  };

  return (
    <>
      {/* Floating Templates Button */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg shadow-lg font-medium transition-all flex items-center gap-2"
          title="Insert Template"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
          </svg>
          Templates
        </button>
      </div>

      {/* Templates Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Choose a Template</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Quickly start with a pre-built template
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Category Filter */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
              <div className="flex gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                      selectedCategory === category
                        ? "bg-violet-600 text-white"
                        : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Templates Grid */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleInsertTemplate(template)}
                    className="p-4 border-2 border-gray-200 dark:border-slate-700 rounded-xl hover:border-violet-500 dark:hover:border-violet-500 hover:shadow-lg transition-all text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl shrink-0">{template.icon}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 mb-1">
                          {template.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {template.description}
                        </p>
                        <span className="inline-block mt-2 text-xs px-2 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 rounded">
                          {template.category}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
