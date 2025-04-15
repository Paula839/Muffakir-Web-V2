'use client';
import Link from "next/link";
import ThemeToggle from "../components/ThemeToggle";
import LanguageToggle from "../components/LanguageToggle";
import translations from "../translations/translations";
import { useEffect, useState } from "react";
import ProfileDropdown from "./ProfileDropdown";
import { useUser } from "../context/UserContext";

type Question = {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
};

function TestPage() {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const { user, setUser } = useUser();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/user/me", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        }
      } catch (error: any) {
        if (error.message && error.message !== "Failed to fetch") {
          console.error("Error fetching user data:", error);
        }
      }
    };
    fetchUser();
  }, [setUser]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') === 'ar' ? 'ar' : 'en';
    setLang(savedLang);
    document.documentElement.setAttribute('lang', savedLang);

    try {
      const quizData = localStorage.getItem('quizData');
      if (quizData) {
        const parsedData = JSON.parse(quizData);
        if (
          parsedData.questions &&
          parsedData.options &&
          parsedData.correct_answers &&
          Array.isArray(parsedData.questions) &&
          parsedData.questions.length > 0
        ) {
          const formattedQuestions: Question[] = parsedData.questions.map(
            (text: string, index: number) => {
              const options = parsedData.options[index] || [];
              const correctAnswer = parsedData.correct_answers[index] || '';
              // Validate options and correct answer
              if (options.length !== 4) {
                console.warn(`Question ${index + 1} has ${options.length} options, expected 4`);
              }
              if (!options.includes(correctAnswer) && typeof correctAnswer !== 'number') {
                console.warn(`Correct answer for question ${index + 1} not in options`);
              }
              return {
                id: index + 1,
                text,
                options: options.length === 4 ? options : ["Option 1", "Option 2", "Option 3", "Option 4"],
                correctAnswer: options.includes(correctAnswer) ? correctAnswer : options[0] || "",
                explanation: parsedData.explanations?.[index] || undefined,
              };
            }
          );
          setQuestions(formattedQuestions);
        } else {
          console.error("Invalid quiz data structure");
        }
      }
    } catch (error) {
      console.error("Error parsing quiz data:", error);
    } finally {
      setLoading(false);
      localStorage.removeItem('quizData');
    }
  }, []);

  const handleLanguageChange = () => {
    const newLang = lang === 'en' ? 'ar' : 'en';
    setLang(newLang);
    localStorage.setItem('lang', newLang);
    document.documentElement.setAttribute('lang', newLang);
  };

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = answer;
    setUserAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const calculateScore = () => {
    const correct = questions.filter(
      (q, index) => userAnswers[index] === q.correctAnswer
    ).length;
    setScore(correct);
  };

  return (
    <main className="container">
      <ThemeToggle />
      <LanguageToggle lang={lang} onToggle={handleLanguageChange} />
      <ProfileDropdown lang={lang} />

      <div className="test-container">
        <Link href="/" className="title-link">
          <h1 className="title">{translations[lang].testTitle}</h1>
        </Link>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>{translations[lang].loading}</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="error-container">
            <h3>{translations[lang].noQuizAvailable}</h3>
            <Link href="/" className="back-button">
              {translations[lang].backToChat}
            </Link>
          </div>
        ) : score === null ? (
          <div className="question-container">
            <div className="progress">
              {translations[lang].question} {currentQuestion + 1}{' '}
              {translations[lang].of} {questions.length}
            </div>

            <div className="question-card">
              <h3>{questions[currentQuestion].text}</h3>
              <div className="options-container">
                {questions[currentQuestion].options.map((option, index) => (
                  <button
                    key={index}
                    className={`option-button ${
                      userAnswers[currentQuestion] === option ? 'selected' : ''
                    }`}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={score !== null}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="navigation-buttons">
              <button
                className="nav-button prev-button"
                onClick={handlePreviousQuestion}
                disabled={currentQuestion === 0}
              >
                {translations[lang].previous}
              </button>

              {currentQuestion < questions.length - 1 ? (
                <button
                  className="nav-button next-button"
                  onClick={handleNextQuestion}
                  disabled={!userAnswers[currentQuestion]}
                >
                  {translations[lang].next}
                </button>
              ) : (
                <button
                  className="nav-button submit-button"
                  onClick={calculateScore}
                  disabled={!userAnswers[currentQuestion]}
                >
                  {translations[lang].submit}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="result-container">
            <h2>
              {translations[lang].yourScore} {score}/{questions.length}
            </h2>
            {questions.map((q, index) => (
              <div key={q.id} className="question-review">
                <h4>{q.text}</h4>
                <p>
                  {translations[lang].yourAnswer}: {userAnswers[index] || 'None'}
                </p>
                <p>
                  {translations[lang].correctAnswer}: {q.correctAnswer}
                </p>
                {q.explanation && (
                  <p>{translations[lang].explanation}: {q.explanation}</p>
                )}
              </div>
            ))}
            <button
              className="restart-button"
              onClick={() => {
                setCurrentQuestion(0);
                setUserAnswers([]);
                setScore(null);
              }}
            >
              {translations[lang].tryAgain}
            </button>
            <Link href="/" className="back-button">
              {translations[lang].backToChat}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

export default TestPage;