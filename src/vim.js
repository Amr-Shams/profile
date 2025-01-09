import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Code, User, MessageSquare, FileText } from 'lucide-react';
import { GitHub, Linkedin, Twitter, Mail as Envelope } from 'react-feather';

const VimPortfolio = () => {
    const [mode, setMode] = useState('normal');
    const [keyBuffer, setKeyBuffer] = useState('');
    const [currentSection, setCurrentSection] = useState(0);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [recommendation, setRecommendation] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [visualFeedback, setVisualFeedback] = useState('');
    const [repos, setRepos] = useState([]);

    const sections = [
        { id: 'about', title: 'About Me', icon: User, color: 'bg-purple-600' },
        { id: 'projects', title: 'Projects', icon: Code, color: 'bg-blue-600' },
        { id: 'blog', title: 'Blog', icon: Book, color: 'bg-green-600' },
        { id: 'recommend', title: 'Recommendations', icon: MessageSquare, color: 'bg-yellow-600' },
        { id: 'cv', title: 'CV', icon: FileText, color: 'bg-red-600' },
        { id: 'contact', title: 'Contact', icon: MessageSquare, color: 'bg-yellow-600' }
    ];

    const shortcuts = {
        'normal': {
            'j': 'Move down',
            'k': 'Move up',
            'gg': 'Go to top',
            'G': 'Go to bottom',
            'i': 'Enter insert mode',
            ':': 'Enter command mode',
            '/': 'Search',
            'h': 'Show help',
            '1': 'Go to About Me',
            '2': 'Go to Projects',
            '3': 'Go to Blog',
            '4': 'Go to Recommendations',
            '5': 'Go to CV',
            'gh': 'Open GitHub',
            'li': 'Open LinkedIn',
            'cv': 'View Resume',
            'dcv': 'Download Resume',
            'mail': 'Send Mail'
        },
        'insert': {
            'ESC': 'Return to normal mode',

        },
        'command': {
            ':q': 'Quit',
            ':w': 'Save',
            ':help': 'Show help',
            ':gh': 'Open GitHub',
            ':li': 'Open LinkedIn',
            ':cv': 'View Resume',
            ':dcv': 'Download Resume',
            ':mail': 'Send Mail'
        }
    };

    const aboutContent = {
        title: "Amr Shams - Architect of Code and Systems",
        description: `
      A Vim aficionado, I advocate for keyboard-first workflows and elegant, minimalist solutions.
    `,
    };


    const blogPosts = [
        { title: 'Index Optimization in Database', description: 'A Query Performance: Guidelines and Real-world Examples', link: 'https://dev.to/nightbird07/index-optimization-in-database-query-performance-guidelines-and-real-world-examples-4f80' },
        { title: 'PostgreSQL Optimization', description: 'A Quick Tip on Using Values Expression', link: 'https://dev.to/nightbird07/postgresql-optimization-a-quick-tip-on-using-values-expression-2fce' },
        { title: 'Nulls inside your DB', description: 'Nulls are equal in distinct but inequal in unique.', link: 'https://dev.to/nightbird07/nulls-are-equal-in-distinct-but-inequal-in-unique-52me' },
    ];

    const fetchRepos = async () => {
        try {
            const response = await fetch('https://api.github.com/users/Amr-Shams/repos');
            const data = await response.json();
            const filteredRepos = data.filter(repo => !repo.archived);

            setRepos(filteredRepos);
        } catch (error) {
            console.error('Error fetching repositories:', error);
        }
    };

    useEffect(() => {
        fetchRepos();
    }, []);
    const truncateDescription = (description) => {
        if (!description) return 'a self explanatory project';
        if (description.length > 89) {
            return `${description.substring(0, 89)}...`;
        } else {
            return description;
        }
    };
    const memoizedRepos = useMemo(() => {
        const shuffledRepos = repos
            .map(repo => ({ ...repo, randomIndex: Math.random() }))
            .sort((a, b) => a.randomIndex - b.randomIndex);
        return shuffledRepos.slice(0, 5);
    }, [repos]);
    const handleNormalMode = useCallback((e) => {
        const newBuffer = keyBuffer + e.key;
        setKeyBuffer(newBuffer);

        switch (e.key) {
            case 'i':
                setMode('insert');
                setStatusMessage('-- INSERT --');
                break;
            case ':':
                setMode('command');
                setStatusMessage(':');
                break;
            case 'j':
                setCurrentSection(prev => Math.min(prev + 1, sections.length - 1));
                break;
            case 'k':
                setCurrentSection(prev => Math.max(prev - 1, 0));
                break;
            case 'h':
                setShowShortcuts(true);
                break;
            case '1':
                setCurrentSection(0);
                break;
            case '2':
                setCurrentSection(1);
                break;
            case '3':
                setCurrentSection(2);
                break;
            case '4':
                setCurrentSection(3);
                break;
            case '5':
                setCurrentSection(4);
                break;
            case 'Escape':
                setKeyBuffer('');
                break;
            default:
                if (shortcuts.normal[newBuffer]) {
                    executeCommand(newBuffer);
                    setKeyBuffer('');
                } else {
                    setTimeout(() => setKeyBuffer(''), 500);
                }
                break;
        }
    }, [keyBuffer, sections.length]);

    const handleInsertMode = useCallback((e) => {
        if (e.key === 'Escape') {
            setMode('normal');
            setStatusMessage('');
            return;
        }

        if (currentSection === 3) { // Recommendations section
            if (e.key === 'Backspace') {
                setRecommendation(prev => prev.slice(0, -1));
            } else if (e.key.length === 1) {
                setRecommendation(prev => prev + e.key);
            }
        }
    }, [currentSection]);

    const handleCommandMode = useCallback((e) => {
        if (e.key === 'Enter') {
            const cmd = statusMessage.slice(1);
            executeCommand(cmd);
            setMode('normal');
            setStatusMessage('');
        } else if (e.key === 'Escape') {
            setMode('normal');
            setStatusMessage('');
        } else if (e.key === 'Backspace') {
            setStatusMessage(prev => prev.slice(0, -1));
        } else if (e.key.length === 1) {
            setStatusMessage(prev => prev + e.key);
        }
    }, [statusMessage]);

    useEffect(() => {
        const handleKeyPress = (e) => {
            // Prevent default for vim navigation keys
            if (['j', 'k', 'h', 'l', 'i'].includes(e.key)) {
                e.preventDefault();
            }

            // Visual feedback
            setVisualFeedback(e.key);
            setTimeout(() => setVisualFeedback(''), 200);

            // Mode-specific handling
            switch (mode) {
                case 'normal':
                    handleNormalMode(e);
                    break;
                case 'insert':
                    handleInsertMode(e);
                    break;
                case 'command':
                    handleCommandMode(e);
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [mode, currentSection, keyBuffer, handleNormalMode, handleInsertMode, handleCommandMode]);

    const executeCommand = (cmd) => {
        switch (cmd) {
            case 'q':
                setShowShortcuts(false);
                window.close();
                break;
            case 'w':
                setStatusMessage('"portfolio.vim" written');
                setTimeout(() => setStatusMessage(''), 2000);
                break;
            case 'help':
                setShowShortcuts(true);
                break;
            case 'gh':
                window.open('https://github.com/Amr-Shams', '_blank');
                break;
            case 'li':
                window.open('https://www.linkedin.com/in/amr-shams-b5107519b/', '_blank');
                break;
            case 'cv':
                window.open('https://drive.google.com/file/d/1jZ8xTXvAP7qqkuxnDJXPu4s30UhcL4GD/view?usp=share_link', '_blank');
                break;
            case 'dcv':
                const link = document.createElement('a');
                link.href = 'https://drive.google.com/uc?export=download&id=1jZ8xTXvAP7qqkuxnDJXPu4s30UhcL4GD';
                link.download = 'Amr Shams - Resume.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                break;
            case 'mail':
                window.location.href = 'mailto:amr.shams2015.as@gmail.com';
                break;
            default:
                setStatusMessage(`Error: Unknown command "${cmd}"`);
                setTimeout(() => setStatusMessage(''), 2000);
                break;
        }
    };

    const renderContent = () => {
        const section = sections[currentSection];

        switch (section.id) {
            case 'about':
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <h2 className="text-3xl font-bold text-purple-400">{aboutContent.title}</h2>
                        <p className="text-gray-300 whitespace-pre-line">{aboutContent.description}</p>

                    </motion.div>
                );

            case 'projects':
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <h2 className="text-3xl font-bold text-yellow-400">Projects</h2>
                        <ul className="list-disc list-inside space-y-2">
                            {memoizedRepos.map(repo => (
                                <li key={repo.id} className="project-card">
                                    <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="project-title">
                                        {repo.name}
                                    </a>
                                     <p className="project-description">{truncateDescription(repo.description)}</p>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                );

            case 'blog':
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <h2 className="text-3xl font-bold text-yellow-400">Blog</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {blogPosts.map((post, index) => (
                                <div key={index} className="project-card">
                                    <a href={post.link} target="_blank" rel="noopener noreferrer" className="project-title">
                                        {post.title}
                                    </a>
                                    <p className="project-description">{truncateDescription(post.description)}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                );

            case 'recommend':
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <h2 className="text-3xl font-bold text-yellow-400">Write a Recommendation</h2>
                        <div className="relative">
                            <div
                                className="bg-gray-800 p-4 rounded min-h-[200px] font-mono"
                                style={{ whiteSpace: 'pre-wrap' }}
                            >
                                {recommendation || (mode === 'insert' ? '|' : 'Press i to start writing...')}
                            </div>
                        </div>
                    </motion.div>
                );

            case 'cv':
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <h2 className="text-3xl font-bold text-yellow-400">Curriculum Vitae</h2>
                        <div className="relative">
                            <div className="bg-gray-800 p-4 rounded font-mono">
                                <p className="text-gray-300">You can view or download my CV using the commands below:</p>
                                <ul className="list-disc list-inside space-y-2">
                                    <li className="text-gray-300">:cv - View Resume</li>
                                    <li className="text-gray-300">:dcv - Download Resume</li>
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                );
                case 'contact':
                    return (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8 p-6 bg-gray-800 rounded-lg shadow-md"
                        >
                            <h2 className="text-4xl font-extrabold text-yellow-400 tracking-widest text-center">
                                Contact Me I am friendly 🖖
                            </h2>
                            <p className="text-gray-300 text-lg text-center italic">
                                Beam me up, fellow code wrangler. Let's connect and geek out together!
                            </p>
                            <div className="flex justify-center space-x-6">
                                <a 
                                    href="https://github.com/amrshams" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="group relative flex flex-col items-center"
                                >
                                    <GitHub size={40} className="text-green-400 group-hover:text-gray-300 transition-all" />
                                    <span className="text-sm text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                                        GitHub
                                    </span>
                                </a>
                                <a 
                                    href="https://linkedin.com/in/amrshams" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="group relative flex flex-col items-center"
                                >
                                    <Linkedin size={40} className="text-blue-400 group-hover:text-gray-300 transition-all" />
                                    <span className="text-sm text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                                        LinkedIn
                                    </span>
                                </a>
                                <a 
                                    href="https://twitter.com/nerd_shams" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="group relative flex flex-col items-center"
                                >
                                    <Twitter size={40} className="text-blue-500 group-hover:text-gray-300 transition-all" />
                                    <span className="text-sm text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                                        Twitter
                                    </span>
                                </a>
                                <a 
                                    href="mailto:amrshams@nerdmail.com" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="group relative flex flex-col items-center"
                                >
                                    <Envelope size={40} className="text-red-400 group-hover:text-gray-300 transition-all" />
                                    <span className="text-sm text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                                        Email
                                    </span>
                                </a>
                            </div>
                        </motion.div>
                    );

            default:
                return null;
        }
    };

    return (
        <div className="h-screen bg-gray-900 text-white font-mono relative">
            {/* Key Press Feedback */}
            <AnimatePresence>
                {visualFeedback && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="key-feedback"
                    >
                        {visualFeedback}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Shortcuts Help */}
            <AnimatePresence>
                {showShortcuts && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center shortcuts-modal"
                        style={{ zIndex: 9999 }} // Set z-index to 9999
                        onClick={() => setShowShortcuts(false)}
                    >
                        <div className="bg-gray-800 p-6 rounded-lg max-w-2xl">
                            <h2 className="text-2xl font-bold mb-4">Available Shortcuts</h2>
                            {Object.entries(shortcuts).map(([modeName, modeShortcuts]) => (
                                <div key={modeName} className="mb-4">
                                    <h3 className="text-xl font-bold text-purple-400 mb-2">
                                        {modeName.toUpperCase()} Mode
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(modeShortcuts).map(([key, description]) => (
                                            <div key={key} className="flex justify-between">
                                                <code className="bg-gray-700 px-2 py-1 rounded">{key}</code>
                                                <span>{description}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Layout */}
            <div className="flex h-full">
                {/* Sidebar */}
                <div className="w-48 bg-gray-800 p-4">
                    {sections.map((section, index) => {
                        const Icon = section.icon;
                        return (
                            <motion.div
                                key={section.id}
                                initial={false}
                                animate={{
                                    backgroundColor: index === currentSection ? section.color : 'transparent',
                                    scale: index === currentSection ? 1.05 : 1
                                }}
                                className={`p-2 rounded mb-2 flex items-center gap-2 ${index === currentSection ? 'text-white' : 'text-gray-400'
                                    }`}
                            >
                                <Icon size={16} />
                                <span>{section.title}</span>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Main Content */}
                <div className="flex-1 p-8 overflow-y-auto">
                    <AnimatePresence mode="wait">
                        {renderContent()}
                    </AnimatePresence>
                </div>
            </div>

            {/* Status Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gray-800 text-white p-2 flex justify-between">
                <div className="flex gap-4">
                    <span>MODE: {mode.toUpperCase()}</span>
                    {keyBuffer && <span>Buffer: {keyBuffer}</span>}
                </div>
                <div>{statusMessage}</div>
            </div>
        </div>
    );
};

export default VimPortfolio;