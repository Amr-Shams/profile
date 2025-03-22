import React, { useState, useEffect, useCallback } from "react";
import { User, Code, Book, MessageSquare, FileText } from "lucide-react";
import { GitHub, Linkedin, Twitter, Mail as Envelope } from "react-feather";

const ElevatedPortfolio = () => {
  const [mode, setMode] = useState("normal");
  const [keyBuffer, setKeyBuffer] = useState("");
  const [currentSection, setCurrentSection] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [recommendation, setRecommendation] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [visualFeedback, setVisualFeedback] = useState("");
  const [articles, setArticles] = useState([]);
  const [repos, setRepos] = useState([]);

  const sections = [
    { id: "about", title: "About Me", icon: User, color: "#2d3748" },
    { id: "projects", title: "Projects", icon: Code, color: "#2d3748" },
    { id: "blog", title: "Blog", icon: Book, color: "#2d3748" },
    {
      id: "recommend",
      title: "Recommendations",
      icon: MessageSquare,
      color: "#2d3748",
    },
    { id: "cv", title: "CV", icon: FileText, color: "#2d3748" },
    { id: "contact", title: "Contact", icon: MessageSquare, color: "#2d3748" },
  ];

  const shortcuts = {
    normal: {
      j: "Move down",
      k: "Move up",
      gg: "Go to top",
      G: "Go to bottom",
      i: "Enter insert mode",
      ":": "Enter command mode",
      "/": "Search",
      h: "Show help",
      1: "Go to About Me",
      2: "Go to Projects",
      3: "Go to Blog",
      4: "Go to Recommendations",
      5: "Go to CV",
      6: "Go to Contact",
      gh: "Open GitHub",
      li: "Open LinkedIn",
      cv: "View Resume",
      dcv: "Download Resume",
      mail: "Send Mail",
    },
    insert: {
      ESC: "Return to normal mode",
    },
    command: {
      ":q": "Quit",
      ":w": "Save",
      ":help": "Show help",
      ":gh": "Open GitHub",
      ":li": "Open LinkedIn",
      ":cv": "View Resume",
      ":dcv": "Download Resume",
      ":mail": "Send Mail",
    },
  };

  const aboutContent = {
    title: "Amr Shams - Architect of Code and Systems",
    description: `A Vim aficionado, I advocate for keyboard-first workflows and elegant, minimalist solutions.
If this is your first time here, press h or :help to see available shortcuts.`,
  };

  const fetchRepos = async () => {
    try {
      const response = await fetch(
        "https://api.github.com/users/Amr-Shams/repos",
      );
      const data = await response.json();
      const filteredRepos = data.filter((repo) => !repo.archived);
      setRepos(filteredRepos.slice(0, 3));
    } catch (error) {
      console.error("Error fetching repositories:", error);
    }
  };
  const fetchArticles = async () => {
    try {
      const articles = await fetch(
        `https://dev.to/api/articles?username=nightbird07`,
      ).then((res) => res.json());
      setArticles(articles.slice(0, 5));
    } catch (error) {
      console.log("Error fetching articles:", error);
    }
  };

  useEffect(() => {
    fetchRepos();
    fetchArticles();
  }, []);

  const truncateDescription = (description) => {
    if (!description) return "A self explanatory project";
    if (description.length > 89) {
      return `${description.substring(0, 89)}...`;
    }
    return description;
  };

  const handleNormalMode = useCallback(
    (e) => {
      const newBuffer = keyBuffer + e.key;
      setKeyBuffer(newBuffer);

      switch (e.key) {
        case "i":
          setMode("insert");
          setStatusMessage("-- INSERT --");
          break;
        case ":":
          setMode("command");
          setStatusMessage(":");
          break;
        case "j":
          setCurrentSection((prev) => Math.min(prev + 1, sections.length - 1));
          break;
        case "k":
          setCurrentSection((prev) => Math.max(prev - 1, 0));
          break;
        case "h":
          setShowShortcuts(true);
          break;
        case "1":
          setCurrentSection(0);
          break;
        case "2":
          setCurrentSection(1);
          break;
        case "3":
          setCurrentSection(2);
          break;
        case "4":
          setCurrentSection(3);
          break;
        case "5":
          setCurrentSection(4);
          break;
        case "6":
          setCurrentSection(5);
          break;
        case "g":
          if (newBuffer === "gg") {
            setCurrentSection(0);
          }
          break;
        case "G":
          setCurrentSection(sections.length - 1);
          break;
        case "Escape":
          setKeyBuffer("");
          break;
        default:
          if (shortcuts.normal[newBuffer]) {
            executeCommand(newBuffer);
            setKeyBuffer("");
          } else {
            setTimeout(() => setKeyBuffer(""), 500);
          }
          break;
      }
    },
    [keyBuffer, sections.length],
  );

  const handleInsertMode = useCallback(
    (e) => {
      if (e.key === "Escape") {
        setMode("normal");
        setStatusMessage("");
        return;
      }

      if (currentSection === 3) {
        // Recommendations section
        if (e.key === "Backspace") {
          setRecommendation((prev) => prev.slice(0, -1));
        } else if (e.key.length === 1) {
          setRecommendation((prev) => prev + e.key);
        }
      }
    },
    [currentSection],
  );

  const handleCommandMode = useCallback(
    (e) => {
      if (e.key === "Enter") {
        const cmd = statusMessage.slice(1);
        executeCommand(cmd);
        setMode("normal");
        setStatusMessage("");
      } else if (e.key === "Escape") {
        setMode("normal");
        setStatusMessage("");
      } else if (e.key === "Backspace") {
        setStatusMessage((prev) => prev.slice(0, -1));
      } else if (e.key.length === 1) {
        setStatusMessage((prev) => prev + e.key);
      }
    },
    [statusMessage],
  );

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Prevent default for vim navigation keys
      if (["j", "k", "h", "l", "i"].includes(e.key)) {
        e.preventDefault();
      }

      // Visual feedback
      setVisualFeedback(e.key);
      setTimeout(() => setVisualFeedback(""), 200);

      // Mode-specific handling
      switch (mode) {
        case "normal":
          handleNormalMode(e);
          break;
        case "insert":
          handleInsertMode(e);
          break;
        case "command":
          handleCommandMode(e);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    mode,
    currentSection,
    keyBuffer,
    handleNormalMode,
    handleInsertMode,
    handleCommandMode,
  ]);

  const executeCommand = (cmd) => {
    switch (cmd) {
      case "q":
        if (showShortcuts) {
          setShowShortcuts(false);
        } else {
          window.close();
        }
        break;
      case "w":
        if (currentSection === 3 && recommendation) {
          setStatusMessage("Recommendation saved successfully!");
          window.location.href = `mailto:amr.shams2015.as@gmail.com?subject=Recommendation&body=${recommendation}`;
        }
        break;
      case "help":
        setShowShortcuts(true);
        break;
      case "gh":
        window.open("https://github.com/Amr-Shams", "_blank");
        break;
      case "li":
        window.open(
          "https://www.linkedin.com/in/amr-abdelmaqsoud-b5107519b/",
          "_blank",
        );
        break;
      case "cv":
        window.open(
          "https://drive.google.com/file/d/1jZ8xTXvAP7qqkuxnDJXPu4s30UhcL4GD/view?usp=share_link",
          "_blank",
        );
        break;
      case "dcv":
        const link = document.createElement("a");
        link.href =
          "https://drive.google.com/uc?export=download&id=1jZ8xTXvAP7qqkuxnDJXPu4s30UhcL4GD";
        link.download = "Amr Shams - Resume.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        break;
      case "mail":
        window.location.href = "mailto:amr.shams2015.as@gmail.com";
        break;
      default:
        setStatusMessage(`Error: Unknown command "${cmd}"`);
        setTimeout(() => setStatusMessage(""), 2000);
        break;
    }
  };

  const renderContent = () => {
    const section = sections[currentSection];

    switch (section.id) {
      case "about":
        return (
          <div className="content-section">
            <h2 className="section-title">{aboutContent.title}</h2>
            <p className="section-text">{aboutContent.description}</p>
          </div>
        );

      case "projects":
        return (
          <div className="content-section">
            <h2 className="section-title">Projects</h2>
            <div className="card-grid">
              {repos.map((repo) => (
                <div key={repo.id} className="card">
                  <h3 className="card-title">{repo.name}</h3>
                  <p className="card-description">
                    {truncateDescription(repo.description)}
                  </p>
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-link"
                  >
                    <GitHub size={16} /> View Repository
                  </a>
                </div>
              ))}
            </div>
          </div>
        );

      case "blog":
        return (
          <div className="content-section">
            <h2 className="section-title">Blog</h2>
            <div className="card-grid">
              {articles.map((post, index) => (
                <div key={index} className="card">
                  <h3 className="card-title">{post.title}</h3>
                  <p className="card-description">
                    {truncateDescription(post.description)}
                  </p>
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-link"
                  >
                    <Book size={16} /> Read Article
                  </a>
                </div>
              ))}
            </div>
          </div>
        );

      case "recommend":
        return (
          <div className="content-section">
            <h2 className="section-title">Write a Recommendation</h2>
            <div className="code-editor">
              {recommendation ||
                (mode === "insert" ? "|" : "Press i to start writing...")}
            </div>
          </div>
        );

      case "cv":
        return (
          <div className="content-section">
            <h2 className="section-title">Curriculum Vitae</h2>
            <div className="code-editor">
              <p>You can view or download my CV using the commands below:</p>
              <ul className="cv-commands">
                <li>
                  <code>:cv</code> - View Resume
                </li>
                <li>
                  <code>:dcv</code> - Download Resume
                </li>
              </ul>
            </div>
          </div>
        );

      case "contact":
        return (
          <div className="content-section">
            <h2 className="section-title">Contact</h2>
            <p className="section-text">
              Beam me up, fellow code wrangler. Let's connect and geek out
              together!
            </p>
            <div className="contact-links">
              <a
                href="https://github.com/Amr-Shams"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link"
              >
                <GitHub size={24} />
                <span>GitHub</span>
              </a>
              <a
                href="https://www.linkedin.com/in/amr-abdelmaqsoud-b5107519b/"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link"
              >
                <Linkedin size={24} />
                <span>LinkedIn</span>
              </a>
              <a
                href="https://twitter.com/AMR_SHAMS07"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link"
              >
                <Twitter size={24} />
                <span>Twitter</span>
              </a>
              <a
                href="mailto:amrshams2015@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link"
              >
                <Envelope size={24} />
                <span>Email</span>
              </a>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="portfolio-container">
      {/* Key Press Feedback */}
      {visualFeedback && <div className="key-feedback">{visualFeedback}</div>}

      {/* Shortcuts Help */}
      {showShortcuts && (
        <div className="shortcuts-modal" onClick={() => setShowShortcuts(true)}>
          <div
            className="shortcuts-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Available Shortcuts</h2>
            {Object.entries(shortcuts).map(([modeName, modeShortcuts]) => (
              <div key={modeName} className="shortcut-section">
                <h3>{modeName.toUpperCase()} Mode</h3>
                <div className="shortcut-grid">
                  {Object.entries(modeShortcuts).map(([key, description]) => (
                    <div key={key} className="shortcut-item">
                      <code>{key}</code>
                      <span>{description}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="ascii-header">
        {`
         __     ______  _    _  __          _______ _   _ 
         \\ \\   / / __ \\| |  | | \\ \\        / /_   _| \\ | |
          \\ \\_/ / |  | | |  | |  \\ \\  /\\  / /  | | |  \\| |
           \\   /| |  | | |  | |   \\ \\/  \\/ /   | | | . \` |
            | | | |__| | |__| |    \\  /\\  /   _| |_| |\\  |
            |_|  \\____/ \\____/      \\/  \\/   |_____|_| \\_|
        `}
      </div>

      <div className="portfolio-layout">
        {/* Sidebar */}
        <div className="sidebar">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                className={`sidebar-item ${index === currentSection ? "active" : ""}`}
              >
                <Icon size={16} />
                <span>{section.title}</span>
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="main-content">{renderContent()}</div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-section">
          <span className="mode-indicator">{mode.toUpperCase()}</span>
          {keyBuffer && <span className="buffer-indicator">{keyBuffer}</span>}
        </div>
        <div className="status-message">{statusMessage}</div>
      </div>
    </div>
  );
};

export default ElevatedPortfolio;
