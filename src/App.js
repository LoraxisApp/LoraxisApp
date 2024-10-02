import React, { useState, useEffect } from "react";
import "./App.css";
import logo from './assets/lrx.png'; 
import getContract, { getSignerContract } from './contract';
import '@fortawesome/fontawesome-free/css/all.min.css';


const App = () => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState("homePage");
  const [account, setAccount] = useState(null);
  const [username, setUsername] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const [completedQuizzes, setCompletedQuizzes] = useState([]);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [score, setScore] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [upcomingQuizzes, setUpcomingQuizzes] = useState([]); // State to store upcoming quizzes

  useEffect(() => {
    if (window.ethereum) {

  
      // Check if the wallet was connected before
  
      // Check if accounts are already connected on page load
      window.ethereum.request({ method: "eth_accounts" }).then((accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsWalletConnected(true);
        } else {
          setAccount(null);
          setIsWalletConnected(false);
        }
      });
  
      // Listen for account changes or disconnects
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length === 0) {
          // Handle disconnection (MetaMask logout)
          handleWalletDisconnect();
        } else {
          // Update the account when changed
          setAccount(accounts[0]);
          setIsWalletConnected(true);
          localStorage.setItem("account", accounts[0]);
          localStorage.setItem("isWalletConnected", "true");
        }
      });
  
      window.ethereum.on("disconnect", () => {
        handleWalletDisconnect();
      });
    } else {
      alert("Please install MetaMask to use this application.");
    }
  
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleWalletDisconnect);
        window.ethereum.removeListener("disconnect", handleWalletDisconnect);
      }
    };
  }, []);
  
  
  
  

  const handleWalletConnect = async (e) => {
    e.preventDefault();
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        setIsWalletConnected(true);
  
        // Store account and connection status in localStorage
        localStorage.setItem("isWalletConnected", "true");
        localStorage.setItem("account", accounts[0]);
      } else {
        // If no accounts are returned, make sure to reset the state
        setAccount(null);
        setIsWalletConnected(false);
      }
    } catch (error) {
      console.error("Cüzdan bağlantı hatası:", error);
    }
  };
  
  

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-3)}`;
  };
  

  const handleWalletDisconnect = () => {
    setAccount(null);
    setIsWalletConnected(false);
    setUsername("");
  
    // Remove wallet connection status from localStorage
    localStorage.removeItem("isWalletConnected");
    localStorage.removeItem("account");
  };
  
  
  

  

  const fetchUpcomingQuizzes = async () => {
    try {
      const contract = await getContract();
      const upcoming = await contract.getUpcomingQuizzes(); // Call the smart contract function
  
      // Create a copy of the array using map or spread operator to avoid modifying the read-only array
      const upcomingCopy = [...upcoming]; // or: upcoming.map(quiz => ({ ...quiz }));
  
      // Sort the copied quizzes array based on startDate (converted to a Number)
      const sortedUpcoming = upcomingCopy.sort((a, b) => Number(a.startDate) - Number(b.startDate));
  
      setUpcomingQuizzes(sortedUpcoming); // Store the sorted quizzes in the state
    } catch (error) {
      console.error("Error fetching upcoming quizzes:", error);
    }
  };
  
  
  
  
  
  

  useEffect(() => {
    fetchUpcomingQuizzes(); // Fetch upcoming quizzes on component mount
  }, []);

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    const quizTitle = e.target.title.value;
    const logoUrl = e.target.logoUrl.value;
    const coverUrl = e.target.coverUrl.value;
    const description = e.target.description.value;
    const questionCount = parseInt(e.target.questionCount.value);
    const startDateTime = new Date(e.target.startDateTime.value).getTime(); // Get the datetime in milliseconds
    const duration = parseInt(e.target.duration.value) * 1000; // Convert to milliseconds
  



      try {
   
        const contract = await getSignerContract();
        const tx = await contract.createQuiz(quizTitle, logoUrl, coverUrl, description, questionCount, startDateTime, duration);
        await tx.wait();
      } catch (error) {
        console.error(error);
      }






  };



  const renderUpcomingQuizzes = () => {
    if (upcomingQuizzes.length === 0) {
      return <p>No upcoming quizzes available.</p>;
    }
  
    return upcomingQuizzes.map((quiz, index) => (
      <li key={index}>
        <h3>{quiz.title}
        {/* Convert BigInt quiz.startDate to number before subtracting */}
        ------------
        {(Math.floor((Number(quiz.startDate) - new Date().getTime()) / 1000) / 3600).toFixed(1)} hours later
        </h3>
      </li>
    ));
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

  useEffect(() => {
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
  
  {/* Change this input to datetime-local */}
  <input type="datetime-local" name="startDateTime" placeholder="Start Date and Time" required />
  
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
  <li
    className={selectedMenu === "homePage" ? "gradient-active" : ""}
    onClick={() => setSelectedMenu("homePage")}
  >
    <i className="fas fa-home"></i> Homepage
    <i className="fas fa-angle-right right-arrow"></i> {/* Add the arrow */}
  </li>
  <li
    className={selectedMenu === "joinQuizzes" ? "gradient-active" : ""}
    onClick={() => setSelectedMenu("joinQuizzes")}
  >
    <i className="fas fa-edit"></i> Join Quizzes
    <i className="fas fa-angle-right right-arrow"></i>
  </li>
  <li
    className={selectedMenu === "completedQuizzes" ? "gradient-active" : ""}
    onClick={() => setSelectedMenu("completedQuizzes")}
  >
    <i className="fas fa-check-circle"></i> Completed Quizzes
    <i className="fas fa-angle-right right-arrow"></i>
  </li>
  <li
    className={selectedMenu === "leaderboard" ? "gradient-active" : ""}
    onClick={() => setSelectedMenu("leaderboard")}
  >
    <i className="fas fa-trophy"></i> Leaderboard
    <i className="fas fa-angle-right right-arrow"></i>
  </li>
  <li
    className={selectedMenu === "help" ? "gradient-active" : ""}
    onClick={() => setSelectedMenu("help")}
  >
    <i className="fas fa-question-circle"></i> Help
    <i className="fas fa-angle-right right-arrow"></i>
  </li>
</ul>




<ul className="menu">
  {/* Create Quiz with icon */}
  <li
    className={selectedMenu === "createQuiz" ? "gradient-active" : ""}
    onClick={() => setSelectedMenu("createQuiz")}
  >
    <i className="fas fa-plus-circle"></i> {/* Icon for Create Quiz */}
    Create Quiz
    <i className="fas fa-angle-right right-arrow"></i>
  </li>

  {/* Show login link when wallet is not connected */}
  {!isWalletConnected && (
    <li
      className={selectedMenu === "login" ? "gradient-active" : ""}
      onClick={handleWalletConnect}
    >
      <i className="fas fa-sign-in-alt"></i> {/* Icon for Login */}
      Login
      <i className="fas fa-angle-right right-arrow"></i>
    </li>
  )}

  {/* Show active wallet address and username when wallet is connected */}
  {isWalletConnected && (
    <>
      <li>
        <i className="fas fa-wallet"></i> {/* Icon for Active Wallet Address */}
        <span>Active Wallet Address: {formatAddress(account)}</span>
      </li>
      <li>
        <i className="fas fa-user"></i> {/* Icon for Active Username */}
        <span>Active Username: {username}</span>
      </li>
    </>
  )}
</ul>



            
            
          </div>
          <div className="content">{renderContent()}</div>
          <div className="upcoming-quizzes">
  {/* Flex container to hold both Next Quizzes and View All button */}
  <div className="quizzes-header">
    <h2>Next Quizzes</h2>
    {/* View All button to the right */}
    <button className="view-all" onClick={() => setSelectedMenu("joinQuizzes")}>
      View All
    </button>
  </div>
  <ul>{renderUpcomingQuizzes()}</ul>
</div>


        </>
    </div>
  );
};

export default App;
