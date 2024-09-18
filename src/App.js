import React, { useState, useEffect } from "react";
import Web3 from "web3";
import "./App.css";
import logo from './assets/lrx.png'; 

const App = () => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState("homePage");
  const [account, setAccount] = useState(null);
  const [username, setUsername] = useState("");
  const [web3, setWeb3] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [completedQuizzes, setCompletedQuizzes] = useState([]);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [score, setScore] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    if (window.ethereum) {
      setWeb3(new Web3(window.ethereum));
    } else {
      alert("Please install MetaMask to use this application.");
    }
  }, []);

  const handleWalletConnect = async (e) => {
    e.preventDefault();
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
      setIsWalletConnected(true);
    } catch (error) {
      console.error("Cüzdan bağlantı hatası:", error);
    }
  };

  const handleWalletDisconnect = () => {
    setAccount(null);
    setIsWalletConnected(false);
    setUsername(""); 
  };

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    const name = e.target.username.value;
    if (name) {
      setUsername(name);
      handleWalletConnect(e); 
    }
  };

  const handleCreateQuiz = (e) => {
    e.preventDefault();
    const quizTitle = e.target.title.value;
    const questionCount = parseInt(e.target.questionCount.value);
    const startDate = new Date().getTime(); 
    const duration = parseInt(e.target.duration.value) * 1000; 

    if (quizTitle && questionCount && duration) {
      const newQuiz = {
        title: quizTitle,
        questionCount,
        startDate,
        duration,
        questions: [],
        answers: [],
        isCompleted: false,
      };
      setCurrentQuiz(newQuiz);
      setQuestions(Array.from({ length: questionCount }, () => ({ question: "", options: ["", "", "", ""] })));
      setAnswers(Array(questionCount).fill(""));
    }
  };

  const handleAddQuestion = (index, e) => {
    const { name, value } = e.target;
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [name]: value };
    setQuestions(updatedQuestions);
  };

  const handleAddOptions = (qIndex, oIndex, e) => {
    const value = e.target.value;
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex].options[oIndex] = value;
    setQuestions(updatedQuestions);
  };

  const handleAddAnswer = (index, e) => {
    const value = e.target.value;
    const updatedAnswers = [...answers];
    updatedAnswers[index] = value;
    setAnswers(updatedAnswers);
  };

  const handleSubmitQuiz = () => {
    const updatedQuiz = { ...currentQuiz, questions, answers };
    setQuizzes([...quizzes, updatedQuiz]);
    setCurrentQuiz(null);
    setQuestions([]);
    setAnswers([]);
    setSelectedMenu("joinQuizzes");
  };

  const handleQuizCompletion = () => {
    const now = new Date().getTime();
    const updatedQuizzes = quizzes.map((quiz) => {
      const timeRemaining = quiz.duration - (now - quiz.startDate);
      if (timeRemaining <= 0) {
        return { ...quiz, isCompleted: true };
      }
      return quiz;
    });

    const completed = updatedQuizzes.filter(quiz => quiz.isCompleted && !completedQuizzes.includes(quiz));
    setCompletedQuizzes([...completedQuizzes, ...completed]); 
    setQuizzes(updatedQuizzes.filter(quiz => !quiz.isCompleted));
  };

  useEffect(() => {
    const interval = setInterval(handleQuizCompletion, 1000); 
    return () => clearInterval(interval);
  }, [quizzes, completedQuizzes]);

  const calculateTimeRemaining = (quiz) => {
    const now = new Date().getTime();
    const timeRemaining = quiz.duration - (now - quiz.startDate);
    return Math.max(0, Math.floor(timeRemaining / 1000)); 
  };

  const handleJoinQuiz = (quizIndex) => {
    const selectedQuiz = quizzes[quizIndex];
    setCurrentQuiz(selectedQuiz);
    setQuestions(selectedQuiz.questions);
    setAnswers(selectedQuiz.answers);
    setUserAnswers(Array(selectedQuiz.questions.length).fill("")); 
    setSelectedMenu("answerQuiz");
  };

  const handleSelectAnswer = (qIndex, option) => {
    const updatedUserAnswers = [...userAnswers];
    updatedUserAnswers[qIndex] = option;
    setUserAnswers(updatedUserAnswers);
  };

  const handleSubmitAnswers = () => {
    let newScore = 0;
    userAnswers.forEach((answer, index) => {
      if (answer === answers[index]) {
        newScore += 1;
      }
    });

    const reward = newScore * 10;
    setScore(reward);

    const participant = {
      username,
      quizzes: 1,
      totalReward: reward,
    };

    const updatedLeaderboard = [...leaderboard];
    const existingParticipantIndex = updatedLeaderboard.findIndex((p) => p.username === username);
    if (existingParticipantIndex >= 0) {
      updatedLeaderboard[existingParticipantIndex].quizzes += 1;
      updatedLeaderboard[existingParticipantIndex].totalReward += reward;
    } else {
      updatedLeaderboard.push(participant);
    }

    setLeaderboard(updatedLeaderboard);
    setSelectedMenu("getScore");
  };

  const renderContent = () => {
    switch (selectedMenu) {
      case "createQuiz":
        return (
          <div>
            <h2>Create New Quiz</h2>
            <form onSubmit={handleCreateQuiz}>
              <input type="text" name="title" placeholder="Quiz Title" required />
              <input type="text" name="logoUrl" placeholder="Logo Url" required />
              <input type="text" name="coverUrl" placeholder="Cover Image Url" required />
              <input type="text" name="description" placeholder="Description" required />
              <input type="number" name="questionCount" placeholder="Number of Questions" required />
              <input type="date" name="startDate" placeholder="Start Date" required />
              <input type="number" name="duration" placeholder="Duration (in seconds)" required />
              <button type="submit">Create Quiz</button>
            </form>

            {currentQuiz && (
              <div className="add-questions-section">
                <h3>Add Questions and Options</h3>
                {questions.map((q, qIndex) => (
                  <div key={qIndex} className="question-block">
                    <input
                      type="text"
                      name="question"
                      placeholder={`Question ${qIndex + 1}`}
                      value={q.question}
                      onChange={(e) => handleAddQuestion(qIndex, e)}
                    />
                    {q.options.map((option, oIndex) => (
                      <input
                        key={oIndex}
                        type="text"
                        name={`option${oIndex + 1}`}
                        placeholder={`Option ${oIndex + 1}`}
                        value={option}
                        onChange={(e) => handleAddOptions(qIndex, oIndex, e)}
                      />
                    ))}
                  </div>
                ))}
                <h3>Add Correct Answers</h3>
                {questions.map((q, index) => (
                  <div key={index}>
                    <input
                      type="text"
                      placeholder={`Correct answer for question ${index + 1}`}
                      onChange={(e) => handleAddAnswer(index, e)}
                    />
                  </div>
                ))}
                <button onClick={handleSubmitQuiz}>Submit Quiz</button>
              </div>
            )}
          </div>
        );
      case "joinQuizzes":
        return (
          <div>
            <h2>Available Quizzes</h2>
            {quizzes.length > 0 ? (
              quizzes.map((quiz, index) => (
                <div key={index} className="quiz-item">
                  <h3>{quiz.title}</h3>
                  <p>Time remaining: {calculateTimeRemaining(quiz)} seconds</p>
                  <button onClick={() => handleJoinQuiz(index)}>Join Quiz</button>
                </div>
              ))
            ) : (
              <p>No quizzes available. Please create a quiz first.</p>
            )}
          </div>
        );
      case "completedQuizzes":
        return (
          <div>
            <h2>Completed Quizzes</h2>
            {completedQuizzes.length > 0 ? (
              completedQuizzes.map((quiz, index) => (
                <div key={index} className="quiz-item">
                  <h3>{quiz.title}</h3>
                  <p>Quiz completed and no longer available for participation.</p>
                </div>
              ))
            ) : (
              <p>No completed quizzes available.</p>
            )}
          </div>
        );
      case "answerQuiz":
        return (
          <div>
            <h2>Answer the Quiz</h2>
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="question-block">
                <h3>{q.question}</h3>
                {q.options.map((option, oIndex) => (
                  <label key={oIndex}>
                    <input
                      type="radio"
                      name={`question${qIndex}`}
                      value={option}
                      checked={userAnswers[qIndex] === option}
                      onChange={() => handleSelectAnswer(qIndex, option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            ))}
            <button onClick={handleSubmitAnswers}>Submit Answers</button>
          </div>
        );
      case "getScore":
        return (
          <div>
            <h2>Your Score</h2>
            <p>Your reward: {score} USDT</p>
            <button onClick={() => setSelectedMenu("claimReward")}>Claim Reward</button>
          </div>
        );
      case "claimReward":
        return (
          <div>
            <h2>Claim Your Reward</h2>
            {score > 0 ? <p>Reward claimed: {score} USDT</p> : <p>No reward to claim.</p>}
          </div>
        );
      case "leaderboard":
        return (
          <div>
            <h2>Leaderboard</h2>
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Username</th>
                  <th>Quizzes Taken</th>
                  <th>Total Reward (USDT)</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard
                  .sort((a, b) => b.totalReward - a.totalReward)
                  .map((user, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td> {/* Rank column */}
                      <td>{user.username}</td>
                      <td>{user.quizzes}</td>
                      <td>{user.totalReward} USDT</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="app">
        <>
          <div className="sidebar">
            <div className="logo-container">
              <img src={logo} alt="Logo" className="logo" />
            </div>
            <ul className="menu">
              <li onClick={() => setSelectedMenu("homePage")}>Homepage</li>
              <li onClick={() => setSelectedMenu("joinQuizzes")}>Join Quizzes</li>
              <li onClick={() => setSelectedMenu("completedQuizzes")}>Completed Quizzes</li>
              <li onClick={() => setSelectedMenu("leaderboard")}>Leaderboard</li>
              <li onClick={() => setSelectedMenu("help")}>Help</li>
            </ul>

            <ul className="menu">
              <li onClick={() => setSelectedMenu("createQuiz")}>Create Quiz</li>
              <p>Connected Account: {account}</p>
            <p>Username: {username}</p> {/* Kullanıcı adı burada gösteriliyor */}
            <button className="disconnect-button" onClick={handleWalletDisconnect}>
              Disconnect Wallet
            </button>


            </ul>
            
            
          </div>
          <div className="content">{renderContent()}</div>
          <div className="upcoming-quizzes">
            <h2>Upcoming Quizzes</h2>
            <ul>
              {quizzes.map((quiz, index) => (
                <li key={index} onClick={() => handleJoinQuiz(index)}>
                  {quiz.title} - Time left: {calculateTimeRemaining(quiz)}s
                </li>
              ))}
            </ul>
          </div>
        </>
    </div>
  );
};

export default App;
