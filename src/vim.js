import React, { useState, useEffect, useRef, useCallback } from "react";
import { Terminal, Download, X } from "lucide-react";

const CONSTANTS = {
  name: "Amr Shams",
  username: "amr",
  hostname: "codecraft",
  title: "Backend Architect | Vim Enthusiast",
  githubApiUsername: "Amr-Shams",
  devToUsername: "nightbird07",
  githubUrl: "https://github.com/Amr-Shams",
  linkedinUrl: "https://www.linkedin.com/in/amr-abdelmaqsoud-b5107519b/",
  twitterUrl: "https://twitter.com/AMR_SHAMS07",
  email: "amr.shams2015.as@gmail.com",
};

const COMMANDS = {
  help: "Show available commands",
  about: "About me",
  skills: "Tech stack & skills",
  projects: "View projects",
  blog: "Read articles",
  timeline: "Career journey",
  contact: "Get in touch",
  clear: "Clear terminal",
  matrix: "Enter the matrix...",
  gh: "Open GitHub profile",
  li: "Open LinkedIn profile",
};

const SECTIONS = [
  { id: "about", title: "About", key: "1" },
  { id: "skills", title: "Skills", key: "2" },
  { id: "timeline", title: "Timeline", key: "3" },
  { id: "projects", title: "Projects", key: "4" },
  { id: "blog", title: "Blog", key: "5" },
  { id: "contact", title: "Contact", key: "6" },
  { id: "resume", title: "Resume", key: "7" },
];

const getWelcomeMessage = () => `
  █████╗ ███╗   ███╗██████╗     ███████╗██╗  ██╗ █████╗ ███╗   ███╗███████╗
 ██╔══██╗████╗ ████║██╔══██╗    ██╔════╝██║  ██║██╔══██╗████╗ ████║██╔════╝
 ███████║██╔████╔██║██████╔╝    ███████╗███████║███████║██╔████╔██║███████╗
 ██╔══██║██║╚██╔╝██║██╔══██╗    ╚════██║██╔══██║██╔══██║██║╚██╔╝██║╚════██║
 ██║  ██║██║ ╚═╝ ██║██║  ██║    ███████║██║  ██║██║  ██║██║ ╚═╝ ██║███████║
 ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝    ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝

${CONSTANTS.title}

Tip: This portfolio is a Vim-inspired terminal.
Press 'i' to type, 'esc' to exit, and 'h' for help. Use j/k to navigate sections.
`;

const getContent = (id, data) => {
  const { repos, articles } = data;
  switch (id) {
    case 'about':
      return `
About Me
────────
Hey! I'm ${CONSTANTS.name}, a software engineer specializing in scalable backend systems.
I'm passionate about Go, Python, and the art of writing elegant, efficient code.

My philosophy is rooted in Unix principles: minimalism, automation, and building tools
that do one thing well. I'm a Vim aficionado and a firm believer in keyboard-first workflows.

When I'm not coding, I'm probably brewing coffee or exploring new tech.
`;
    case 'skills':
      const skills = [
        { name: "Go", level: 95 }, { name: "Python", level: 90 },
        { name: "JavaScript/TS", level: 85 }, { name: "React", level: 85 },
        { name: "PostgreSQL", level: 80 }, { name: "Docker", level: 75 },
      ];
      return `
Tech Stack
──────────
${skills.map(skill => {
        const bars = "█".repeat(Math.floor(skill.level / 10));
        const empty = "░".repeat(10 - Math.floor(skill.level / 10));
        return `${skill.name.padEnd(15)} [${bars}${empty}] ${skill.level}%`;
      }).join("\n")}

Languages: Go, Python, JavaScript, TypeScript, Rust
Backend:   gRPC, REST, Microservices, PostgreSQL
Frontend:  React, Next.js, Vue.js
DevOps:    Docker, Git, CI/CD, Nginx, Prometheus
`;
    case 'timeline':
      return `
Career Timeline
───────────────
* Oct 2025 - Present | ITI          | Software Engineer 
  └─ Building enterprise tools and external platforms 
* Oct 2024 - Oct 2025 | IKEA        | Software Engineer
  └─ Building enterprise tools and internal platforms.

* Jan 2024 - Oct 2024 | Fedni       | Full Stack Engineer
  └─ Led React migration and backend architecture improvements.

* Jun 2023 - Jan 2024 | CrossWorkers| PHP Developer
  └─ Migrated legacy PHP 5.6 systems to 7.4, boosting performance.
`;
    case 'projects':
      if (!repos || repos.length === 0) return "Fetching projects...";
      return `
Top Public Projects on GitHub
─────────────────────────────
${repos.map(repo =>
        `* ${repo.name.padEnd(25)} ⭐ ${repo.stargazers_count}
  └─ ${repo.description || "No description provided."}
     🔗 ${repo.html_url}`
      ).join("\n")}
`;
    case 'blog':
      if (!articles || articles.length === 0) return "Fetching articles...";
      return `
Recent Articles on Dev.to
─────────────────────────
${articles.map(article =>
        `* ${article.title}
  └─ ${article.url}`
      ).join("\n")}
`;
    case 'contact':
      return `
Get In Touch
────────────
Email:    ${CONSTANTS.email}
GitHub:   ${CONSTANTS.githubUrl}
LinkedIn: ${CONSTANTS.linkedinUrl}
Twitter:  ${CONSTANTS.twitterUrl}

Beam me up, fellow code wrangler! Let's build something amazing.
`;
    default:
      return "";
  }
};

const useDataFetching = () => {
  const [data, setData] = useState({ repos: [], articles: [] });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cachedData = JSON.parse(localStorage.getItem('portfolio_data'));
        if (cachedData && Date.now() - cachedData.timestamp < 1000 * 60 * 120) {
          setData(cachedData.data);
          return;
        }
        const repoUrl = `https://api.github.com/users/${CONSTANTS.githubApiUsername}/repos?per_page=100`;
        const articleUrl = `https://dev.to/api/articles?username=${CONSTANTS.devToUsername}`;
        const [repoRes, articleRes] = await Promise.all([fetch(repoUrl), fetch(articleUrl)]);
        if (!repoRes.ok || !articleRes.ok) throw new Error('API request failed');
        const repoData = await repoRes.json();
        const articleData = await articleRes.json();
        const sortedRepos = repoData.filter(r => !r.archived).sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 6);
        const latestArticles = articleData.slice(0, 5);
        const freshData = { repos: sortedRepos, articles: latestArticles };
        setData(freshData);
        localStorage.setItem('portfolio_data', JSON.stringify({ data: freshData, timestamp: Date.now() }));
      } catch (err) {
        setError("Failed to fetch data from APIs. Please try again later.");
      }
    };
    fetchData();
  }, []);

  return { data, error };
};

const VimPortfolio = () => {
  const [mode, setMode] = useState("normal");
  const [history, setHistory] = useState([
    { type: 'system', content: getWelcomeMessage(), timestamp: Date.now() }
  ]);
  const [input, setInput] = useState("");
  const [currentSection, setCurrentSection] = useState(0);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [keyBuffer, setKeyBuffer] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [matrixMode, setMatrixMode] = useState(false);
  const [showResume, setShowResume] = useState(false);

  const { data, error } = useDataFetching();
  const inputRef = useRef(null);
  const terminalRef = useRef(null);

  const addToHistory = useCallback((type, content) => {
    setHistory(prev => [...prev, { type, content, timestamp: Date.now() }]);
  }, []);

  const executeCommand = useCallback((cmd) => {
    if (!cmd) return;
    const trimmed = cmd.trim().toLowerCase();

    if (cmd !== 'about' || history.length > 1) {
      addToHistory("command", trimmed);
    }

    setCommandHistory(prev => [trimmed, ...prev]);
    setHistoryIndex(-1);

    const command = trimmed.split(" ")[0];
    const sectionCmd = SECTIONS.find(s => s.id === command || s.key === command);

    if (sectionCmd) {
      const sectionIndex = SECTIONS.findIndex(s => s.id === sectionCmd.id);
      setCurrentSection(sectionIndex);

      if (sectionCmd.id === 'resume') {
        setShowResume(true);
        addToHistory("system", "Opening resume...");
      } else {
        addToHistory("output", getContent(sectionCmd.id, data));
      }
      return;
    }

    switch (command) {
      case "help": case "h":
        setShowHelp(true);
        break;
      case "clear":
        setHistory([
          { type: 'system', content: getWelcomeMessage(), timestamp: Date.now() }
        ]);
        executeCommand('about');
        break;
      case "matrix":
        setMatrixMode(true);
        setTimeout(() => setMatrixMode(false), 3000);
        addToHistory("output", "⚡ Entering the matrix...");
        break;
      case "gh":
        window.open(CONSTANTS.githubUrl, "_blank");
        addToHistory("system", `Redirecting to ${CONSTANTS.githubUrl}...`);
        break;
      case "li":
        window.open(CONSTANTS.linkedinUrl, "_blank");
        addToHistory("system", `Redirecting to ${CONSTANTS.linkedinUrl}...`);
        break;
      default:
        addToHistory("error", `command not found: ${command}. Type 'help'.`);
    }
  }, [data, addToHistory, history.length]);

  useEffect(() => {
    executeCommand('about');
    if (error) {
      addToHistory("error", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  useEffect(() => {
    terminalRef.current?.scrollTo(0, terminalRef.current.scrollHeight);
  }, [history]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showResume) { setShowResume(false); return; }
        if (showHelp) { setShowHelp(false); return; }
        setInput("");
        setMode("normal");
        inputRef.current?.blur();
        return;
      }

      if (showHelp || showResume) return;

      if (mode === 'insert') {
        if (e.key === 'Enter') {
          e.preventDefault();
          executeCommand(input);
          setInput("");
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (historyIndex < commandHistory.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setInput(commandHistory[newIndex]);
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setInput(commandHistory[newIndex]);
          } else if (historyIndex === 0) {
            setHistoryIndex(-1);
            setInput("");
          }
        } else if (e.key === 'Tab') {
          e.preventDefault();
          const matches = Object.keys(COMMANDS).filter(cmd => cmd.startsWith(input));
          if (matches.length === 1) setInput(matches[0]);
          else if (matches.length > 1) addToHistory('system', `Possible completions: ${matches.join('  ')}`);
        }
      } else if (mode === 'normal') {
        e.preventDefault();
        let newKeyBuffer = keyBuffer + e.key;
        const isNumericKey = SECTIONS.some(s => s.key === e.key);

        if (e.key === 'j') {
          const nextIndex = Math.min(currentSection + 1, SECTIONS.length - 1);
          executeCommand(SECTIONS[nextIndex].id);
        } else if (e.key === 'k') {
          const prevIndex = Math.max(currentSection - 1, 0);
          executeCommand(SECTIONS[prevIndex].id);
        } else if (e.key === 'h' || e.key === '?') {
          executeCommand('help');
        } else if (newKeyBuffer === 'gg') {
          executeCommand(SECTIONS[0].id);
          newKeyBuffer = '';
        } else if (e.key === 'G') {
          executeCommand(SECTIONS[SECTIONS.length - 1].id);
        } else if (isNumericKey) {
          executeCommand(e.key);
        } else if (e.key === 'i') {
          setMode('insert');
          inputRef.current?.focus();
        }

        setKeyBuffer(newKeyBuffer);
        setTimeout(() => setKeyBuffer(""), 500);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, input, executeCommand, commandHistory, historyIndex, currentSection, keyBuffer, showHelp, showResume, addToHistory]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0d1117] text-gray-300 font-mono overflow-hidden">
      {matrixMode && <div className="fixed inset-0 pointer-events-none opacity-20 text-xs z-50 text-green-400"></div>}

      <div className="bg-[#161b22] border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Terminal className="w-5 h-5 text-blue-400" />
          <span className="text-blue-400 font-bold">{CONSTANTS.username}@{CONSTANTS.hostname}</span>
        </div>
        <div className="text-xs px-2 py-1 bg-gray-800 rounded text-gray-400">-- {mode.toUpperCase()} --</div>
      </div>

      <div className="bg-[#161b22] border-b border-gray-700 px-4 py-2 flex gap-2 overflow-x-auto">
        {SECTIONS.map((section, idx) => (
          <button key={section.id} onClick={() => { executeCommand(section.id); }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm transition-all ${currentSection === idx ? 'bg-gray-700 text-blue-400' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}>
            <span>{section.title}</span>
            <span className="text-xs opacity-50">{section.key}</span>
          </button>
        ))}
      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showResume && <ResumeModal onClose={() => setShowResume(false)} />}

      <div ref={terminalRef} className="flex-1 overflow-y-auto p-4 text-sm" onClick={() => { setMode('insert'); inputRef.current?.focus(); }}>
        {history.map((item, idx) => (
          <div key={`${item.timestamp}-${idx}`} className="mb-2">
            {item.type === "command" && (
              <div className="flex items-center gap-2">
                <span className="text-blue-400">{CONSTANTS.username}@{CONSTANTS.hostname}</span>
                <span className="text-green-400">$</span>
                <span className="text-white">{item.content}</span>
              </div>
            )}
            {item.type === "output" && <pre className="whitespace-pre-wrap text-gray-300">{item.content}</pre>}
            {item.type === "error" && <pre className="whitespace-pre-wrap text-red-400">Error: {item.content}</pre>}
            {item.type === "system" && <pre className="whitespace-pre-wrap text-cyan-400">{item.content}</pre>}
          </div>
        ))}

        {mode === 'insert' && (
          <div className="flex items-center gap-2">
            <span className="text-blue-400">{CONSTANTS.username}@{CONSTANTS.hostname}</span>
            <span className="text-green-400">$</span>
            <input ref={inputRef} type="text" value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent outline-none text-white"
              autoFocus spellCheck={false}
            />
            <span className="cursor-blink">▋</span>
          </div>
        )}
      </div>

      <div className="bg-[#161b22] border-t border-gray-700 p-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span className={`font-bold px-2 py-1 rounded ${mode === 'normal' ? 'bg-blue-600' : 'bg-green-600'}`}>
            {mode.toUpperCase()}
          </span>
          <span className="text-gray-400">{SECTIONS[currentSection].title}</span>
        </div>
        <div className="text-gray-500">
          {mode === 'normal' ? "Press 'i' to type" : "Press 'esc' to exit insert mode"} | Press 'h' for help
        </div>
      </div>
    </div>
  );
};

const ResumeModal = ({ onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[#161b22] border-2 border-blue-800 rounded-lg p-4 max-w-4xl w-[90%] h-[90%] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 text-blue-400">
          <h2 className="text-xl">My Resume</h2>
          <div className="flex items-center gap-4">
            <a
              href="/resume.pdf"
              download="AmrShams_Resume.pdf"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors text-sm"
            >
              <Download size={16} />
              Download
            </a>
            <button onClick={onClose} className="hover:text-red-400 transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-gray-700 rounded-md">
          <iframe
            src="/resume.pdf"
            title="Amr Shams Resume"
            width="100%"
            height="100%"
            className="border-none rounded-md"
          />
        </div>
      </div>
    </div>
  );
};

const HelpModal = ({ onClose }) => (
  <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-40" onClick={onClose}>
    <div className="bg-[#161b22] border-2 border-cyan-800 rounded-lg p-6 max-w-3xl w-full" onClick={e => e.stopPropagation()}>
      <h2 className="text-2xl text-cyan-400 mb-4 flex items-center gap-2"><Terminal /> Commands & Shortcuts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div>
          <h3 className="text-yellow-400 mb-2">NORMAL Mode Navigation</h3>
          <div className="space-y-1">
            <div><kbd className="px-2 py-1 bg-gray-800 rounded">j / k</kbd><span className="ml-2 text-gray-400">Navigate sections down/up</span></div>
            <div><kbd className="px-2 py-1 bg-gray-800 rounded">gg</kbd><span className="ml-2 text-gray-400">Go to first section</span></div>
            <div><kbd className="px-2 py-1 bg-gray-800 rounded">G</kbd><span className="ml-2 text-gray-400">Go to last section</span></div>
            <div><kbd className="px-2 py-1 bg-gray-800 rounded">1-7</kbd><span className="ml-2 text-gray-400">Jump to a specific section</span></div>
            <div><kbd className="px-2 py-1 bg-gray-800 rounded">h / ?</kbd><span className="ml-2 text-gray-400">Show this help dialog</span></div>
            <div><kbd className="px-2 py-1 bg-gray-800 rounded">i</kbd><span className="ml-2 text-gray-400">Enter INSERT mode to type commands</span></div>
          </div>
        </div>
        <div>
          <h3 className="text-yellow-400 mb-2">INSERT Mode Commands</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(COMMANDS).map(([cmd, desc]) => (
              <div key={cmd}><kbd className="px-2 py-1 bg-gray-800 rounded text-green-400">{cmd}</kbd><span className="text-gray-400 text-xs ml-2">{desc}</span></div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={CONSTANTS.githubUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded flex items-center gap-2">GitHub</a>
            <a href={CONSTANTS.linkedinUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded flex items-center gap-2">LinkedIn</a>
            <a href={`mailto:${CONSTANTS.email}`} className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded flex items-center gap-2">Email</a>
          </div>
        </div>
      </div>
      <button onClick={onClose} className="mt-6 w-full px-4 py-2 bg-cyan-900 hover:bg-cyan-800 text-cyan-400 rounded transition-colors">Close (esc)</button>
    </div>
  </div>
);

export default VimPortfolio;
