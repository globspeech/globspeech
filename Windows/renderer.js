const { useState, useEffect, useCallback } = React;

function App() {
    const [currentPage, setCurrentPage] = useState('learn');
    const [foundation, setFoundation] = useState([]);
    const [config, setConfig] = useState({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const foundationData = await window.electronAPI.loadFoundation();
        const configData = await window.electronAPI.loadConfig();
        setFoundation(foundationData);
        setConfig(configData);
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'learn':
                return <LearnPage foundation={foundation} config={config} />;
            case 'words':
                return <WordsPage foundation={foundation} />;
            case 'dictionary':
                return <DictionaryPage />;
            case 'notes':
                return <NotesPage />;
            case 'video':
                return <VideoPage />;
            case 'settings':
                return <SettingsPage />;
            default:
                return <LearnPage foundation={foundation} config={config} />;
        }
    };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflow: 'auto' }}>
                {renderPage()}
            </div>
            <nav style={{
                display: 'flex',
                justifyContent: 'space-around',
                padding: '10px',
                backgroundColor: '#fff',
                borderTop: '1px solid #ddd'
            }}>
                {['learn', 'words', 'dictionary', 'notes', 'video', 'settings'].map(page => (
                    <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        style={{
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '5px',
                            backgroundColor: currentPage === page ? '#007bff' : '#f0f0f0',
                            color: currentPage === page ? '#fff' : '#333',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        {page === 'learn' && '学习'}
                        {page === 'words' && '单词'}
                        {page === 'dictionary' && '词典'}
                        {page === 'notes' && '笔记'}
                        {page === 'video' && '视频'}
                        {page === 'settings' && '设置'}
                    </button>
                ))}
            </nav>
        </div>
    );
}

function LearnPage({ foundation, config }) {
    const [currentWordId, setCurrentWordId] = useState(null);
    const [showBack, setShowBack] = useState(false);
    const [remainingCount, setRemainingCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [noTasks, setNoTasks] = useState(false);
    const [translationData, setTranslationData] = useState({});
    const [sentenceData, setSentenceData] = useState({});
    const [translatedSentences, setTranslatedSentences] = useState({});
    const [cardState, setCardState] = useState('front'); 

    useEffect(() => {
        loadWord();
        checkBackButton();
        updateCount();
    }, []);

    useEffect(() => {
        if (currentWordId && config.translation_language) {
            loadTranslationData();
        }
    }, [currentWordId, config.translation_language]);

    const loadWord = async () => {
        setLoading(true);
        const wordId = await window.electronAPI.whichNowId();
        if (wordId === 999999) {
            setNoTasks(true);
        } else {
            setNoTasks(false);
            setCurrentWordId(wordId);
            setCardState('front');
        }
        setLoading(false);
    };

    const loadTranslationData = async () => {
        if (!config.translation_language) return;

        const translationFile = `${config.translation_language}_foundation.csv`;
        const sentenceFile = 'sentence.csv';
        const translatedSentenceFile = `${config.translation_language}_sentence.csv`;

        const [translations, sentences, translatedSents] = await Promise.all([
            window.electronAPI.loadCsv(translationFile),
            window.electronAPI.loadCsv(sentenceFile),
            window.electronAPI.loadCsv(translatedSentenceFile)
        ]);

        const transData = {};
        translations.forEach(row => {
            if (row[0] && row[1]) {
                transData[parseInt(row[0])] = row[1];
            }
        });
        setTranslationData(transData);

        const sentData = {};
        sentences.forEach(row => {
            if (row[0]) {
                sentData[parseInt(row[0])] = [row[1], row[2], row[3]].filter(s => s);
            }
        });
        setSentenceData(sentData);

        const transSentData = {};
        translatedSents.forEach(row => {
            if (row[0]) {
                transSentData[parseInt(row[0])] = [row[1], row[2], row[3]].filter(s => s);
            }
        });
        setTranslatedSentences(transSentData);
    };

    const checkBackButton = async () => {
        const result = await window.electronAPI.showBackButton();
        setShowBack(result === 200);
    };

    const updateCount = async () => {
        const count = await window.electronAPI.getCount();
        setRemainingCount(count);
    };

    const handleBack = async () => {
        const result = await window.electronAPI.executeBackButton();
        if (result !== 904904) {
            await loadWord();
            await checkBackButton();
            await updateCount();
        }
    };

    const handleAction = async (action) => {
        await window.electronAPI.inputABCDo(action, currentWordId);
        await loadWord();
        await checkBackButton();
        await updateCount();
    };

    const handleSpeak = () => {
        const word = foundation.find(w => w.id === currentWordId);
        if (word) {
            window.electronAPI.speakWord(word.word);
        }
    };

    const flipCard = () => {
        setCardState('back');
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <p>加载中...</p>
            </div>
        );
    }

    if (noTasks) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <p style={{ fontSize: '18px', color: '#666' }}>当下没有待学习的任务</p>
            </div>
        );
    }

    const currentWord = foundation.find(w => w.id === currentWordId);
    if (!currentWord) return null;

    const translation = translationData[currentWordId] || '';
    const sentences = sentenceData[currentWordId] || [];
    const translatedSents = translatedSentences[currentWordId] || [];

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <p style={{ fontSize: '16px', color: '#666' }}>
                    当前还剩余 {remainingCount}个 未学习
                </p>
                {showBack && (
                    <button
                        onClick={handleBack}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#6c757d',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginBottom: '10px'
                        }}
                    >
                        返回
                    </button>
                )}
            </div>

            <div style={{
                backgroundColor: '#fff',
                borderRadius: '10px',
                padding: '40px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                minHeight: '400px'
            }}>
                {}
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '48px', margin: '0 0 20px 0' }}>
                        {currentWord.word}
                    </h1>
                    <div style={{ fontSize: '24px', color: '#666', marginBottom: '20px' }}>
                        /{currentWord.ipa}/
                        <button
                            onClick={handleSpeak}
                            style={{
                                marginLeft: '10px',
                                padding: '5px 10px',
                                backgroundColor: '#f0f0f0',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '20px'
                            }}
                        >
                            🔊
                        </button>
                    </div>
                </div>

                {}
                {cardState === 'front' ? (
                    <div style={{ textAlign: 'center', marginTop: '40px' }}>
                        <div
                            onClick={flipCard}
                            style={{
                                padding: '20px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: '#666'
                            }}
                        >
                            点击之后 展示释义
                        </div>
                    </div>
                ) : (
                    <div>
                        {}
                        <div style={{ marginTop: '30px', fontSize: '18px', color: '#333' }}>
                            <strong>释义：</strong> {translation}
                        </div>

                        {}
                        {sentences.length > 0 && (
                            <div style={{ marginTop: '30px' }}>
                                <strong>例句：</strong>
                                {sentences.map((sentence, index) => (
                                    <div key={index} style={{ marginTop: '15px' }}>
                                        <div style={{ color: '#333' }}>{sentence}</div>
                                        {translatedSents[index] && (
                                            <div style={{ color: '#666', fontSize: '16px', marginTop: '5px' }}>
                                                {translatedSents[index]}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '20px',
                            marginTop: '40px'
                        }}>
                            <button
                                onClick={() => handleAction('A')}
                                style={{
                                    padding: '15px 30px',
                                    backgroundColor: '#28a745',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontSize: '16px'
                                }}
                            >
                                认识
                            </button>
                            <button
                                onClick={() => handleAction('B')}
                                style={{
                                    padding: '15px 30px',
                                    backgroundColor: '#ffc107',
                                    color: '#333',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontSize: '16px'
                                }}
                            >
                                模糊
                            </button>
                            <button
                                onClick={() => handleAction('C')}
                                style={{
                                    padding: '15px 30px',
                                    backgroundColor: '#dc3545',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontSize: '16px'
                                }}
                            >
                                忘记
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function WordsPage({ foundation }) {
    const [selectedWords, setSelectedWords] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    const filteredWords = foundation.filter(word => 
        word.word.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggleWord = (id) => {
        const newSelected = new Set(selectedWords);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedWords(newSelected);
    };

    const handleAddWords = async () => {
        if (selectedWords.size === 0) return;

        const wordIds = Array.from(selectedWords).join('|') + '|';
        await window.electronAPI.insertFirstBatch(wordIds);
        setSelectedWords(new Set());
        alert('添加成功！');
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2>单词列表</h2>
            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="搜索单词..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: '16px',
                        borderRadius: '5px',
                        border: '1px solid #ddd'
                    }}
                />
            </div>

            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={handleAddWords}
                    disabled={selectedWords.size === 0}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: selectedWords.size > 0 ? '#007bff' : '#ccc',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: selectedWords.size > 0 ? 'pointer' : 'not-allowed',
                        fontSize: '16px'
                    }}
                >
                    添加选中的单词 ({selectedWords.size})
                </button>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '20px' }}>
                {filteredWords.map(word => (
                    <div
                        key={word.id}
                        onClick={() => handleToggleWord(word.id)}
                        style={{
                            padding: '10px',
                            borderBottom: '1px solid #eee',
                            cursor: 'pointer',
                            backgroundColor: selectedWords.has(word.id) ? '#e3f2fd' : 'transparent',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        <strong>{word.word}</strong> /{word.ipa}/
                    </div>
                ))}
            </div>
        </div>
    );
}

function DictionaryPage() {
    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>词典</h2>
            <p>词典</p>
        </div>
    );
}

function NotesPage() {
    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>笔记</h2>
            <p>笔记</p>
        </div>
    );
}

function VideoPage() {
    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>视频</h2>
            <p>视频.</p>
        </div>
    );
}

function SettingsPage() {
    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>设置</h2>
            <p>设置</p>
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));