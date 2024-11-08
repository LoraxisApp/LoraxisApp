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
  const [questionCount, setQuestionCount] = useState(null); // Minimum set to 5
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [score] = useState(null);
  const [leaderboard] = useState([]);
  const [upcomingQuizzes, setUpcomingQuizzes] = useState([]); // State to store upcoming quizzes
  const [loading, setLoading] = useState(false); // Global loading state
  const [quizWithEarliestStartDate, setQuizWithEarliestStartDate] = useState(null);
  const [selectedQuizForDetails, setSelectedQuizForDetails] = useState(null);
  const [SelectedQuizID, setSelectedQuizID] = useState(null);
  const [myQuizzes, setMyQuizzes] = useState([]);
  const [correctAnswers, setCorrectAnswers] = useState([]);
  

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



  const renderSubmitCorrectAnswers = () => {
    return (
      <div>
        <h2>Submit Correct Answers</h2>
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="question-blockX">
            <h4>{q.question}</h4>
            <div className="options-container">
              {q.options.map((option, oIndex) => (
                <label key={oIndex} className="option-label">
                  <input
                    type="radio"
                    name={`correctAnswer${qIndex}`}
                    value={oIndex}
                    checked={correctAnswers[qIndex] === oIndex}
                    onChange={() => handleSelectCorrectAnswer(qIndex, oIndex)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
        ))}
        <button onClick={handleSubmitCorrectAnswers} className="submit-btn">
          Submit Correct Answers
        </button>
      </div>
    );
  };



  const handleSelectCorrectAnswer = (qIndex, optionIndex) => {
    setCorrectAnswers((prevAnswers) => {
      const updatedAnswers = [...prevAnswers];
      updatedAnswers[qIndex] = optionIndex;
      return updatedAnswers;
    });
  };

  // Handler to submit correct answers to the contract
  const handleSubmitCorrectAnswers = async () => {
    if (!selectedQuizForDetails) return;

    setLoading(true);
    try {
      const contract = await getSignerContract();
      const tx = await contract.insertCorrectAnswers(SelectedQuizID, correctAnswers);
      await tx.wait();
      alert("Correct answers submitted successfully!");
      setSelectedMenu("quizDetails"); // Redirect back to quiz details
    } catch (error) {
      console.error("Error submitting correct answers:", error);
      alert("Failed to submit correct answers. Please try again.");
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    setUserAnswers(Array(questions.length).fill(null));
  }, [questions.length]); // Initialize only when questions length changes
  
  

  const fetchMyQuizzes = async () => {
    if (!account) return; // Ensure wallet is connected
  
    try {
      const contract = await getContract();
      const allQuizzes = await contract.getAllQuizzes();



     



  
      // Filter quizzes where the creator matches the connected wallet, checking for undefined creators
      const userCreatedQuizzes = allQuizzes.reduce((acc, quiz, index) => {
        if (formatAddress(quiz.creator) === formatAddress(account)) {
          acc.push({
            title: quiz[0],
        logoURL: quiz[1],
        coverURL: quiz[2],
        description: quiz[3],
        questionCount: Number(quiz[4]),
        startDate: Number(quiz[5]),
        duration: Number(quiz[6]),
        creator: quiz[7],
        answersInserted: quiz[8]
          });
        }
        return acc;
      }, []);
  
      setMyQuizzes(userCreatedQuizzes);
    } catch (error) {
      console.error("Error fetching user's quizzes:", error);
    }
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
      
      const now = new Date().getTime() / 1000;
      const updatedQuizzes = sortedQuizzes.map((quiz) => {
        const timeRemaining = quiz.duration - (now - quiz.startDate);
        if (timeRemaining <= 0) {
          return { ...quiz, isCompleted: true };
        }
        return quiz;
      });
  
      // Clear completedQuizzes to prevent duplication and update the state
      const completed = updatedQuizzes.filter(quiz => quiz.isCompleted);
      setCompletedQuizzes(completed);
      setQuizzes(updatedQuizzes.filter(quiz => !quiz.isCompleted));
  
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    }
  };
  
  
  

  
  
  
  

  useEffect(() => {
    fetchUpcomingQuizzes(); // Fetch upcoming quizzes on component mount
  }, []);

  const handleQuestionCountChange = (e) => {
    const value = e.target.value;
    const count = Math.min(Math.max(parseInt(value, 10), 5), 15);
  
    // If the input is cleared or invalid, set question count to null to allow clearing the field
    if (isNaN(count)) {
      setQuestionCount(null);
      setQuestions([]);
    } else {
      setQuestionCount(count);
      // Create a unique object for each question and set of options
      setQuestions(Array.from({ length: count }, () => ({
        question: "",
        options: ["", "", "", ""],
      })));
    }
  };
  
  

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questions];
    if (field === "question") {
      updatedQuestions[index].question = value;
    } else {
      const optionIndex = parseInt(field.replace("option", ""), 10) - 1;
      updatedQuestions[index].options[optionIndex] = value;
    }
    setQuestions(updatedQuestions);
  };


  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    
    // Check if all question and option fields are filled
    const allFieldsFilled = questions.every(
      (q) => q.question.trim() !== "" && q.options.every((opt) => opt.trim() !== "")
    );
  
    if (!allFieldsFilled) {
      alert("Please fill in all questions and options before creating the quiz.");
      return;
    }
  
    // Gather form data
    const quizTitle = e.target.title.value;
    const logoUrl = e.target.logoUrl.value;
    const coverUrl = e.target.coverUrl.value;
    const description = e.target.description.value;
    const startDateTime = Math.floor(new Date(e.target.startDateTime.value).getTime() / 1000);
    const duration = parseInt(e.target.duration.value) * 60;
  
    setLoading(true);
    try {
      const contract = await getSignerContract();
      const tx = await contract.createQuiz(
        quizTitle, logoUrl, coverUrl, description, questions, startDateTime, duration
      );
      await tx.wait();
      
      // Reset quiz creation fields
      setQuestionCount(5);
      setQuestions(Array(5).fill({ question: "", options: ["", "", "", ""] }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  



  const renderUpcomingQuizzes = () => {
    if (upcomingQuizzes.length === 0) {
      return <p>No upcoming quizzes available.</p>;
    }
  
    return (
      <ul className="quizzes-list">
        {upcomingQuizzes.map((quiz, index) => {
          const startDateNumber = Number(quiz.startDate) * 1000; // Convert BigInt to Number
          const hoursLater = Math.floor((startDateNumber - new Date().getTime()) / 3600000);
          
          return (
            <li key={index} className="quiz-item" onClick={() => handleQuizItemClick(quiz, index)}>
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



    



  const handleSelectAnswer = (qIndex, optionIndex) => {
    setUserAnswers((prevAnswers) => {
      const updatedAnswers = [...prevAnswers];
      updatedAnswers[qIndex] = optionIndex; // Set selected answer as the option index
      return updatedAnswers;
    });
  };
  
  
  

  const handleSubmitAnswers = async () => {
    if (!selectedQuizForDetails) {
      console.error("No quiz selected");
      return;
    }
  
    const quizId = SelectedQuizID; // Get quizId from the selected quiz
    console.log(quizId)
    // Filter out any empty or undefined answers to ensure we don't have NaN values
    const answersArray = userAnswers.map(answer => {
      const parsedAnswer = parseInt(answer, 10);
      return isNaN(parsedAnswer) ? 0 : parsedAnswer; // Default to 0 if answer is invalid
    });
  
    // Check if any answers are still NaN after parsing
    if (answersArray.some(answer => isNaN(answer))) {
      console.error("Invalid answers detected:", answersArray);
      alert("Please fill in all answers before submitting.");
      return;
    }
  
    console.log("Submitting answers:", answersArray); // Debug: log answers to be submitted
  
    setLoading(true); // Show loading spinner during transaction
    try {
      const contract = await getSignerContract(); // Get contract instance with signer
      const tx = await contract.submitAnswers(quizId, answersArray); // Call the submitAnswers function
      await tx.wait(); // Wait for transaction to complete
  
      alert("Answers submitted successfully!");
      setSelectedMenu("getScore"); // Redirect to the score page
    } catch (error) {
      console.error("Error submitting answers:", error);
      alert("Failed to submit answers. Please try again.");
    } finally {
      setLoading(false); // Hide loading spinner after transaction
    }
  };
  
  

  const handleQuizItemClick = async (quiz, index) => {
  try {
    const contract = await getContract();
    const questions = await contract.getQuizQuestions(index);
    setQuestions(questions); // Set fetched questions in state
    setSelectedQuizForDetails(quiz); // Set selected quiz details
    setSelectedQuizID(index); // Set selected quiz details
    setSelectedMenu("quizDetails"); // Switch to quiz details view
  } catch (error) {
    console.error("Error fetching quiz questions:", error);
  }
};


const renderQuizDetails = () => {
  if (!selectedQuizForDetails) return null;

  const { title, description, logoURL, coverURL, questionCount, startDate, duration, creator } = selectedQuizForDetails;

  // Convert BigInt to Number explicitly
  const startDateNumber = Number(startDate) * 1000; // Convert to milliseconds for JavaScript date handling
  const durationInMilliseconds = Number(duration) * 1000; // Duration is given in seconds, convert to milliseconds
  const endDateNumber = startDateNumber + durationInMilliseconds; // Calculate quiz end time
  const isQuizStarted = new Date().getTime() >= startDateNumber; // Check if quiz has started
  const isQuizCompleted = new Date().getTime() >= endDateNumber; // Check if quiz is completed

  const isQuizCreator = formatAddress(account) === formatAddress(creator);

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
          <p><strong>Number of Questions:</strong> {questionCount}</p>
          <p><strong>Start Date:</strong> {new Date(startDateNumber).toLocaleString()}</p>
          <p><strong>Duration:</strong> {duration / 60} minutes</p>
        </div>
      </div>
      <button
        onClick={() => setSelectedMenu("answerQuiz")}
        disabled={!isQuizStarted || isQuizCompleted}  // Disable if quiz hasn't started or has completed
        className={`join-quiz-btn ${!isQuizStarted || isQuizCompleted ? "disabled-btn" : ""}`}
      >
        Join This Quiz
      </button>
    <p>
      {isQuizCreator && (
        <button
          onClick={() => setSelectedMenu("submitCorrectAnswers")}
          disabled={!isQuizCompleted} // Disable until the quiz has completed
          className={`submit-answers-btn ${!isQuizCompleted ? "disabled-btn" : ""}`}
        >
          Submit Correct Answers
        </button>
      )}
</p>

      <button onClick={() => setSelectedMenu("joinQuizzes")} className="back-btn">
        Back to Quizzes
      </button>
    </div>
  );
};

  
  
  

  const renderContent = () => {
    switch (selectedMenu) {
      case "quizDetails":
        return renderQuizDetails();
        case "submitCorrectAnswers":
        return renderSubmitCorrectAnswers();
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
        <input
  type="number"
  name="questionCount"
  placeholder="Number of Questions (5-15)"
  value={questionCount ?? ''} // Use empty string if null
  onChange={handleQuestionCountChange}
  min="5"
  max="15"
  className="input-field"
/>
        <input type="datetime-local" name="startDateTime" placeholder="Start Date and Time" required className="input-field" />
        <input type="number" name="duration" placeholder="Duration (in minutes)" required className="input-field" />
        <button type="submit" className="submit-btn">Create Quiz</button>
      </form>






     
              <div className="add-questions-section">
                <h3>Add Questions and Options</h3>
                {questions.map((q, qIndex) => (
          <div key={qIndex} className="question-block">
            <input
              type="text"
              placeholder={`Question ${qIndex + 1}`}
              value={q.question}
              onChange={(e) => handleQuestionChange(qIndex, "question", e.target.value)}
              className="input-field"
            />
            {q.options.map((option, oIndex) => (
              <input
                key={oIndex}
                type="text"
                placeholder={`Option ${oIndex + 1}`}
                value={option}
                onChange={(e) => handleQuestionChange(qIndex, `option${oIndex + 1}`, e.target.value)}
                className="input-field"
              />
            ))}
          </div>
        ))}
                
              </div>

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
                    Math.floor((Number(quiz.startDate) * 1000 - new Date().getTime()) / 1000) / 3600
                  ).toFixed(0)}{" "}
                  hours remaining
                </div>

                {/* Details Button */}
                <div className="quiz-actionAll">
                  <button 
                    className="join-quiz-btnAll"
                    onClick={() => handleQuizItemClick(quiz, index)}  // Pass quiz to view its details
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


  case "myQuizzes":
    return (
      <div>
        <h2>My Created Quizzes</h2>
        {myQuizzes.length > 0 ? (
          <ul className="quizzes-listAll">
            {myQuizzes.map((quiz, index) => (
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
  
                  {/* Display quiz start date */}
                  <div className="quiz-timeAll">
                    {new Date(Number(quiz.startDate) * 1000).toLocaleString()}
                  </div>
  
                  {/* Details Button */}
                  <div className="quiz-actionAll">
                    <button 
                      className="join-quiz-btnAll"
                      onClick={() => handleQuizItemClick(quiz, index)}  // View details
                    >
                      Details
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No quizzes created by you.</p>
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
          const { title, logoURL, startDate, duration } = selectedQuizForDetails || {};
          const startDateFormatted = new Date(Number(startDate) * 1000).toLocaleString(); // Format start date
          const durationInMinutes = Number(duration) / 60; // Convert duration from seconds to minutes
        
          return (
            <div>
              {/* Quiz Details at the Top */}
              <div className="quiz-details-top">
                <img src={logoURL} alt={`${title} Logo`} className="quiz-details-logo" />
                <h2>{title}</h2>
                <p><strong>Start Date:</strong> {startDateFormatted}</p>
                <p><strong>Duration:</strong> {durationInMinutes} minutes</p>
              </div>
        
              {/* Questions and Answer Options */}
              {questions.map((q, qIndex) => (
  <div key={qIndex} className="question-blockX">
    <h4>{q.question}</h4>
    <div className="options-container">
      {q.options.map((option, oIndex) => (
        <label key={oIndex} className="option-label">
          <input
            type="radio"
            name={`question${qIndex}`}  // Unique name per question to keep each question's options isolated
            value={oIndex}               // Set value as the option index instead of option text
            checked={userAnswers[qIndex] === oIndex}  // Check against the selected index in userAnswers
            onChange={() => handleSelectAnswer(qIndex, oIndex)} // Pass option index to handleSelectAnswer
          />
          {option}
        </label>
      ))}
    </div>
  </div>
))}



<div className="submit-button-container">
  <button onClick={handleSubmitAnswers} className="submit-btn">Submit Answers</button>
</div>

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
  const startDateNumber = Number(startDate) * 1000; // Convert BigInt to Number
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
    onClick={(event) => {
      event.preventDefault()   
       fetchAllQuizzes()
       setSelectedMenu("joinQuizzes")                                    
    }  }
  >
    <i className="fas fa-edit"></i> Join Quizzes
    <i className="fas fa-angle-right right-arrow"></i>
  </li>
  <li
    className={selectedMenu === "completedQuizzes" ? "gradient-active" : ""}
    onClick={(event) => {
      event.preventDefault()   
       fetchAllQuizzes()
       setSelectedMenu("completedQuizzes")                                    
    }  }
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


  <li
  className={selectedMenu === "myQuizzes" ? "gradient-active" : ""}
  onClick={(event) => {
    event.preventDefault();
    fetchMyQuizzes();  // Fetch quizzes created by the connected wallet
    setSelectedMenu("myQuizzes");
  }}
>
  <i className="fas fa-user-circle"></i> My Quizzes
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
