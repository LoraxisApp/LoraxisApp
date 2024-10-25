import React, { useState, useEffect } from "react";
import "./App.css";
import logo from './assets/lrx.png'; 
import getContract, { getSignerContract } from './contract';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { TailSpin } from 'react-loader-spinner';


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
  const [loading, setLoading] = useState(false); // Global loading state
  const [quizWithEarliestStartDate, setQuizWithEarliestStartDate] = useState(null);
  const [selectedQuizForDetails, setSelectedQuizForDetails] = useState(null);

  const LoadingOverlay = ({ isLoading }) => {
    if (!isLoading) return null; // Don't render the overlay if not loading
  
    return (
      <div className="loading-overlay">
        <div className="loader-container">
          <TailSpin height="80" width="80" color="white" ariaLabel="loading" />
          <p>Loading...</p>
        </div>
      </div>
    );
  };


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

      // Set the quiz with the earliest start date
      if (sortedUpcoming.length > 0) {
        setQuizWithEarliestStartDate(sortedUpcoming[0]);
      }
  
      setUpcomingQuizzes(sortedUpcoming); // Store the sorted quizzes in the state
    } catch (error) {
      console.error("Error fetching upcoming quizzes:", error);
    }
  };
  
  
  const fetchAllQuizzes = async () => {
    try {
      const contract = await getContract();
      const allQuizzes = await contract.getAllQuizzes();

      // Map quizzes with meaningful property names
      const mappedQuizzes = allQuizzes.map(quiz => ({
        title: quiz[0],
        logoURL: quiz[1],
        coverURL: quiz[2],
        description: quiz[3],
        questionCount: Number(quiz[4]),
        startDate: Number(quiz[5]),
        duration: Number(quiz[6]),
        creator: quiz[7],
        answersInserted: quiz[8],
      }));

      // Sort quizzes by startDate and find the one with the earliest startDate
      const sortedQuizzes = mappedQuizzes.sort((a, b) => a.startDate - b.startDate);
      setQuizzes(sortedQuizzes);

      
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    }
  };
  
  

  useEffect(() => {
    if (selectedMenu === "joinQuizzes") {
      fetchAllQuizzes(); // Fetch all quizzes when navigating to the Join Quizzes page
    }
  }, [selectedMenu]);
  
  
  
  
  

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
  


    setLoading(true);
      try {
   
        const contract = await getSignerContract();
        const tx = await contract.createQuiz(quizTitle, logoUrl, coverUrl, description, questionCount, startDateTime, duration);
        await tx.wait();
        await fetchUpcomingQuizzes();
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false); // Stop loading animation
      }






  };



  const renderUpcomingQuizzes = () => {
    if (upcomingQuizzes.length === 0) {
      return <p>No upcoming quizzes available.</p>;
    }
  
    return (
      <ul className="quizzes-list">
        {upcomingQuizzes.map((quiz, index) => {
          const startDateNumber = Number(quiz.startDate); // Convert BigInt to Number
          const hoursLater = Math.floor((startDateNumber - new Date().getTime()) / 3600000);
          
          return (
            <li key={index} className="quiz-item" onClick={() => handleQuizItemClick(quiz)}>
              <div className="quiz-left">
                <img src={quiz.logoURL} alt="Quiz Logo" className="quiz-logo" />
                <div className="quiz-info">
                  <span className="quiz-title">{quiz.title}</span>
                  <span className="quiz-description">{quiz.description}</span>
                </div>
              </div>
              <div className="quiz-timing">
                {hoursLater} hours later
              </div>
            </li>
          );
        })}
      </ul>
    );
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

  const handleQuizItemClick = (quiz) => {
    setSelectedQuizForDetails(quiz); // Set selected quiz for detailed view
    setSelectedMenu("quizDetails");  // Switch menu to quiz details view
  };

  const renderQuizDetails = () => {
    if (!selectedQuizForDetails) return null;
  
    const { title, description, logoURL, coverURL, questionCount, startDate, duration } = selectedQuizForDetails;
  
    // Convert BigInt to Number explicitly
    const startDateNumber = Number(startDate);
    const durationInSeconds = Number(duration);
    const questionCountX = Number(questionCount);
  
    return (
      <div className="quiz-details-page">
        <div className="quiz-details-header">
          <img src={coverURL} alt={`${title} Cover`} className="quiz-details-cover" />
          <div className="quiz-details-header-content">
            <h2 className="quiz-details-title">{title}</h2>
            <p className="quiz-details-description">{description}</p>
          </div>
        </div>
        <div className="quiz-details-body">
          <div className="quiz-detail-item">
            <img src={logoURL} alt={`${title} Logo`} className="quiz-details-logo" />
            <p><strong>Number of Questions:</strong> {questionCountX}</p>
            <p><strong>Start Date:</strong> {new Date(startDateNumber).toLocaleString()}</p>
            <p><strong>Duration:</strong> {durationInSeconds / 1000} seconds</p>
          </div>
        </div>
        <button onClick={() => setSelectedMenu("joinQuizzes")} className="back-btn">Back to Quizzes</button>
      </div>
    );
  };
  
  

  const renderContent = () => {
    switch (selectedMenu) {
      case "quizDetails":
        return renderQuizDetails();
      case "homePage":
        return (
          <div>

{renderQuizCover()}
          </div>
        );
      case "createQuiz":
        return (
          <div>
            <h2>Create New Quiz</h2>
         


            <form onSubmit={handleCreateQuiz} className="create-quiz-form">
  <input type="text" name="title" placeholder="Quiz Title" required className="input-field" />
  <input type="text" name="logoUrl" placeholder="Logo Url" required className="input-field" />
  <input type="text" name="coverUrl" placeholder="Cover Image Url" required className="input-field" />
  <input type="text" name="description" placeholder="Description" required className="input-field" />
  <input type="number" name="questionCount" placeholder="Number of Questions" required className="input-field" />
  <input type="datetime-local" name="startDateTime" placeholder="Start Date and Time" required className="input-field" />
  <input type="number" name="duration" placeholder="Duration (in seconds)" required className="input-field" />
  <button type="submit" className="submit-btn">Create Quiz</button>
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
        <ul className="quizzes-listAll">
          {quizzes.map((quiz, index) => (
            <li key={index} className="quiz-itemAll">
              <div className="quiz-content-containerAll">
                {/* Display quiz logo */}
                <div className="quiz-logo-containerAll">
                  <div className="quiz-detailsAll">
                    <img src={quiz.logoURL} alt="Quiz Logo" className="quiz-logoAll" />
                    <span className="quiz-titleAll">{quiz.title}</span>
                  </div>
                </div>

                {/* Display quiz title, description, and question count */}
                <div className="quiz-detailsAll">
                  <span className="quiz-descriptionAll">{quiz.description}</span>
                  <span className="quiz-questionsAll">{quiz.questionCount} questions</span>
                </div>

                {/* Display time remaining */}
                <div className="quiz-timeAll">
                  {(
                    Math.floor((Number(quiz.startDate) - new Date().getTime()) / 1000) / 3600
                  ).toFixed(0)}{" "}
                  hours remaining
                </div>

                {/* Details Button */}
                <div className="quiz-actionAll">
                  <button 
                    className="join-quiz-btnAll"
                    onClick={() => handleQuizItemClick(quiz)}  // Pass quiz to view its details
                  >
                    Details
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No quizzes available.</p>
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


  // Function to calculate the remaining time in days, hours, minutes, and seconds
// Function to calculate the remaining time in days, hours, minutes, and seconds
const calculateTimeRemaining = (startDate) => {
  const now = new Date().getTime();
  
  // Convert BigInt to number for arithmetic operations
  const startDateNumber = Number(startDate); // Convert BigInt to Number
  const timeDiff = startDateNumber - now;

  if (timeDiff <= 0) {
    return "Time has expired";
  }

  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

  return `${days} days ${hours} hours ${minutes} minutes ${seconds} seconds`;
};






const renderQuizCover = () => {
  if (quizWithEarliestStartDate) {
    const timeRemaining = calculateTimeRemaining(quizWithEarliestStartDate.startDate);
  
    return (
      <div className="quiz-cover-container">
        <img
          src={quizWithEarliestStartDate.coverURL}
          alt="Quiz Cover"
          className="quiz-cover-image"
        />
        {/* Add an overlay with title, description, and time remaining */}
        <div className="quiz-cover-overlay">
          <div className="quiz-overlay-content">
            <h2 className="quiz-overlay-title">{quizWithEarliestStartDate.title}</h2>
            <p className="quiz-overlay-description">{timeRemaining}</p>
            <p className="quiz-overlay-time">{quizWithEarliestStartDate.description}</p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

  
  

  return (
    <div className="app">
        <>
        <LoadingOverlay isLoading={loading} />
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

<div className="loraxis-card">
  <h3 className="loraxis-title">What is Loraxis?</h3>
  <button className="loraxis-btn">Review</button>
</div>

            
            
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
