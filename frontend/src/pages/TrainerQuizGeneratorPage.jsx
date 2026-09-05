import { useEffect, useMemo, useRef, useState } from "react";

import aiApi from "../api/aiApi";
import assessmentApi from "../api/assessmentApi";
import competencyApi from "../api/competencyApi";
import ErrorMessage from "../components/ErrorMessage";
import LoadingSpinner from "../components/LoadingSpinner";


const MAX_FILE_SIZE = 20 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".pptx",
  ".txt",
];


const getExtension = (filename = "") => {
  const normalized = filename.toLowerCase();

  const lastDot = normalized.lastIndexOf(".");

  if (lastDot === -1) {
    return "";
  }

  return normalized.slice(lastDot);
};


const formatFileSize = (bytes) => {
  if (!bytes) {
    return "0 B";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};


const normalizeQuestion = (
  question,
  index
) => ({
  id:
    question.id ||
    `generated-question-${index}`,
  question:
    question.question ||
    question.question_text ||
    "",
  difficulty:
    question.difficulty ||
    "medium",
  competency:
    question.competency ||
    "",
  options:
    Array.isArray(question.options)
      ? question.options.map((option) => ({
          value:
            option?.value ||
            "",
          text:
            option?.text ||
            "",
        }))
      : [],
  correct_answer:
    question.correct_answer ||
    "",
  explanation:
    question.explanation ||
    "",
  hint:
    question.hint ||
    "",
});


const getApiErrorMessage = (
  error,
  fallback
) => {
  if (
    typeof error?.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }

  if (
    typeof error?.detail === "string" &&
    error.detail.trim()
  ) {
    return error.detail;
  }

  if (
    typeof error?.error === "string" &&
    error.error.trim()
  ) {
    return error.error;
  }

  return fallback;
};


export default function TrainerQuizGeneratorPage() {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [questionCount, setQuestionCount] =
    useState("10");
  const [difficulty, setDifficulty] =
    useState("");
  const [competencyName, setCompetencyName] =
    useState("");

  const [competencies, setCompetencies] =
    useState([]);

  const [quiz, setQuiz] = useState(null);

  const [loadingCompetencies, setLoadingCompetencies] =
    useState(true);
  const [generating, setGenerating] =
    useState(false);
  const [publishing, setPublishing] =
    useState(false);

  const [error, setError] =
    useState("");
  const [success, setSuccess] =
    useState("");

  const [reviewedQuestions, setReviewedQuestions] =
    useState({});

  const [publishTitle, setPublishTitle] =
    useState("");
  const [publishDescription, setPublishDescription] =
    useState("");

  const [publishedAssessmentId, setPublishedAssessmentId] =
    useState(null);


  useEffect(() => {
    let mounted = true;

    const loadCompetencies = async () => {
      setLoadingCompetencies(true);

      try {
        const response =
          await competencyApi.getAllCompetencies();

        if (!mounted) {
          return;
        }

        const loaded =
          Array.isArray(response)
            ? response
            : Array.isArray(response?.items)
              ? response.items
              : [];

        setCompetencies(loaded);
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        setError(
          getApiErrorMessage(
            loadError,
            "Unable to load competencies."
          )
        );
      } finally {
        if (mounted) {
          setLoadingCompetencies(false);
        }
      }
    };

    loadCompetencies();

    return () => {
      mounted = false;
    };
  }, []);


  const normalizedQuestions = useMemo(() => {
    if (!quiz?.questions) {
      return [];
    }

    return quiz.questions.map(
      normalizeQuestion
    );
  }, [quiz]);


  const selectFile = (selectedFile) => {
    setError("");
    setSuccess("");
    setPublishedAssessmentId(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const extension =
      getExtension(selectedFile.name);

    if (
      !ALLOWED_EXTENSIONS.includes(
        extension
      )
    ) {
      setError(
        "Unsupported file type. Please upload a PDF, PPTX, or TXT file."
      );

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setFile(null);
      return;
    }

    if (
      selectedFile.size >
      MAX_FILE_SIZE
    ) {
      setError(
        "File is too large. Maximum supported size is 20 MB."
      );

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setFile(null);
      return;
    }

    setFile(selectedFile);
    setQuiz(null);
    setReviewedQuestions({});
  };


  const handleFileChange = (
    event
  ) => {
    selectFile(
      event.target.files?.[0] ||
        null
    );
  };


  const removeFile = () => {
    setFile(null);
    setQuiz(null);
    setReviewedQuestions({});
    setPublishedAssessmentId(null);
    setError("");
    setSuccess("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  const generateQuiz = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setPublishedAssessmentId(null);

    if (!file) {
      setError(
        "Upload a PDF, PPTX, or TXT document first."
      );
      return;
    }

    const count =
      Number(questionCount);

    if (
      !Number.isInteger(count) ||
      count < 1 ||
      count > 20
    ) {
      setError(
        "Question count must be between 1 and 20."
      );
      return;
    }

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    formData.append(
      "question_count",
      String(count)
    );

    if (difficulty) {
      formData.append(
        "difficulty",
        difficulty
      );
    }

    if (
      competencyName.trim()
    ) {
      formData.append(
        "competency_name",
        competencyName.trim()
      );
    }

    setGenerating(true);

    try {
      const response =
        await aiApi.generateQuiz(
          formData
        );

      const generatedQuiz =
        response?.quiz || response;

      if (
        !generatedQuiz ||
        !Array.isArray(
          generatedQuiz.questions
        ) ||
        generatedQuiz.questions.length === 0
      ) {
        throw new Error(
          "The AI returned an empty quiz. Please try again with a clearer document."
        );
      }

      const normalizedQuiz = {
        ...generatedQuiz,
        questions:
          generatedQuiz.questions.map(
            normalizeQuestion
          ),
      };

      setQuiz(
        normalizedQuiz
      );

      setReviewedQuestions({});

      setPublishTitle(
        generatedQuiz.title ||
          "AI Generated Assessment"
      );

      setPublishDescription(
        generatedQuiz.description ||
          `AI-generated assessment from ${file.name}.`
      );

      setSuccess(
        `Quiz generated successfully with ${generatedQuiz.questions.length} question${
          generatedQuiz.questions.length === 1
            ? ""
            : "s"
        }. Review the questions before publishing.`
      );
    } catch (generateError) {
      setError(
        getApiErrorMessage(
          generateError,
          "Unable to generate the quiz."
        )
      );
    } finally {
      setGenerating(false);
    }
  };


  const updateQuestion = (
    questionIndex,
    field,
    value
  ) => {
    setQuiz((previous) => {
      if (!previous) {
        return previous;
      }

      const questions =
        previous.questions.map(
          (question, index) =>
            index === questionIndex
              ? {
                  ...question,
                  [field]: value,
                }
              : question
        );

      return {
        ...previous,
        questions,
      };
    });

    setReviewedQuestions(
      (previous) => ({
        ...previous,
        [questionIndex]: true,
      })
    );

    setPublishedAssessmentId(null);
    setSuccess("");
  };


  const updateOption = (
    questionIndex,
    optionIndex,
    field,
    value
  ) => {
    setQuiz((previous) => {
      if (!previous) {
        return previous;
      }

      const questions =
        previous.questions.map(
          (question, index) => {
            if (
              index !==
              questionIndex
            ) {
              return question;
            }

            const options =
              question.options.map(
                (
                  option,
                  currentOptionIndex
                ) =>
                  currentOptionIndex ===
                  optionIndex
                    ? {
                        ...option,
                        [field]:
                          value,
                      }
                    : option
              );

            return {
              ...question,
              options,
            };
          }
        );

      return {
        ...previous,
        questions,
      };
    });

    setReviewedQuestions(
      (previous) => ({
        ...previous,
        [questionIndex]: true,
      })
    );

    setPublishedAssessmentId(null);
    setSuccess("");
  };


  const removeQuestion = (
    questionIndex
  ) => {
    setQuiz((previous) => {
      if (!previous) {
        return previous;
      }

      if (
        previous.questions.length <= 1
      ) {
        return previous;
      }

      return {
        ...previous,
        questions:
          previous.questions.filter(
            (_, index) =>
              index !==
              questionIndex
          ),
      };
    });

    setReviewedQuestions(
      (previous) => {
        const next = {};

        Object.entries(
          previous
        ).forEach(
          ([key, value]) => {
            const index =
              Number(key);

            if (
              index < questionIndex
            ) {
              next[index] =
                value;
            }

            if (
              index > questionIndex
            ) {
              next[index - 1] =
                value;
            }
          }
        );

        return next;
      }
    );

    setPublishedAssessmentId(null);
    setSuccess("");
  };


  const validateQuiz = () => {
    if (!quiz) {
      return "Generate a quiz first.";
    }

    if (
      !publishTitle.trim()
    ) {
      return "Enter an assessment title before publishing.";
    }

    if (
      !Array.isArray(
        quiz.questions
      ) ||
      quiz.questions.length === 0
    ) {
      return "The quiz must contain at least one question.";
    }

    for (
      let index = 0;
      index <
      quiz.questions.length;
      index += 1
    ) {
      const question =
        quiz.questions[index];

      const number =
        index + 1;

      if (
        !question.question?.trim()
      ) {
        return `Question ${number} is missing question text.`;
      }

      if (
        !Array.isArray(
          question.options
        ) ||
        question.options.length !== 4
      ) {
        return `Question ${number} must contain exactly four options.`;
      }

      const optionValues =
        question.options.map(
          (option) =>
            String(
              option?.value ||
                ""
            )
              .trim()
              .toUpperCase()
        );

      const optionTexts =
        question.options.map(
          (option) =>
            String(
              option?.text ||
                ""
            ).trim()
        );

      if (
        optionValues.some(
          (value) =>
            !["A", "B", "C", "D"].includes(
              value
            )
        )
      ) {
        return `Question ${number} has an invalid option label.`;
      }

      if (
        new Set(optionValues)
          .size !== 4
      ) {
        return `Question ${number} must have option labels A, B, C, and D.`;
      }

      if (
        optionTexts.some(
          (text) => !text
        )
      ) {
        return `Question ${number} contains an empty option.`;
      }

      const correctAnswer =
        String(
          question.correct_answer ||
            ""
        )
          .trim()
          .toUpperCase();

      if (
        !["A", "B", "C", "D"].includes(
          correctAnswer
        )
      ) {
        return `Question ${number} must have a valid correct answer: A, B, C, or D.`;
      }

      if (
        !question.explanation?.trim()
      ) {
        return `Question ${number} needs an explanation before publishing.`;
      }
    }

    return "";
  };


  const publishQuiz = async () => {
    setError("");
    setSuccess("");
    setPublishedAssessmentId(null);

    const validationError =
      validateQuiz();

    if (validationError) {
      setError(
        validationError
      );
      return;
    }

    const payload = {
      title:
        publishTitle.trim(),

      description:
        publishDescription.trim() ||
        null,

      questions:
        quiz.questions.map(
          (question) => ({
            competency_id:
              findCompetencyId(
                question.competency
              ),

            question_text:
              question.question.trim(),

            options:
              question.options.map(
                (option) =>
                  option.text.trim()
              ),

            correct_answer:
              getCorrectAnswerText(
                question
              ),

            difficulty:
              question.difficulty ||
              "medium",

            explanation:
              question.explanation.trim(),
          })
        ),
    };

    const missingCompetency =
      payload.questions.findIndex(
        (question) =>
          !question.competency_id
      );

    if (
      missingCompetency !== -1
    ) {
      const questionNumber =
        missingCompetency + 1;

      setError(
        `Select a competency for Question ${questionNumber}. AI competency "${quiz.questions[missingCompetency].competency || "not specified"}" could not be matched automatically.`
      );

      return;
    }

    setPublishing(true);

    try {
      const response =
        await assessmentApi.createGeneratedAssessment(
          payload
        );

      const assessmentId =
        response?.id ||
        response?.assessment_id ||
        null;

      setPublishedAssessmentId(
        assessmentId
      );

      setSuccess(
        `Assessment published successfully with ${payload.questions.length} question${
          payload.questions.length === 1
            ? ""
            : "s"
        }. It is now available through the existing assessment system.`
      );
    } catch (publishError) {
      setError(
        getApiErrorMessage(
          publishError,
          "Unable to publish the generated assessment."
        )
      );
    } finally {
      setPublishing(false);
    }
  };


  const findCompetencyId = (
    competencyValue
  ) => {
    if (
      !competencyValue ||
      !competencies.length
    ) {
      return null;
    }

    const target =
      String(
        competencyValue
      )
        .trim()
        .toLowerCase();

    const exact =
      competencies.find(
        (competency) =>
          String(
            competency.name ||
              ""
          )
            .trim()
            .toLowerCase() ===
          target
      );

    if (exact) {
      return Number(
        exact.id
      );
    }

    const partial =
      competencies.find(
        (competency) => {
          const name =
            String(
              competency.name ||
                ""
            )
              .trim()
              .toLowerCase();

          return (
            name.includes(target) ||
            target.includes(name)
          );
        }
      );

    if (partial) {
      return Number(
        partial.id
      );
    }

    return null;
  };


  const getCorrectAnswerText = (
    question
  ) => {
    const answer =
      String(
        question.correct_answer ||
          ""
      )
        .trim()
        .toUpperCase();

    const matchingOption =
      question.options.find(
        (option) =>
          String(
            option.value ||
              ""
          )
            .trim()
            .toUpperCase() ===
          answer
      );

    return (
      matchingOption?.text ||
      answer
    );
  };


  const clearGeneratedQuiz = () => {
    setQuiz(null);
    setReviewedQuestions({});
    setPublishedAssessmentId(null);
    setSuccess("");
    setError("");
  };


  if (loadingCompetencies) {
    return (
      <LoadingSpinner
        message="Loading quiz generator..."
      />
    );
  }


  return (
    <div style={styles.page}>

      {/* ====================================================
          HEADER
      ===================================================== */}

      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>
            AI-POWERED CONTENT CREATION
          </p>

          <h1 style={styles.title}>
            AI Quiz Generator
          </h1>

          <p style={styles.subtitle}>
            Upload training material and let
            Gemini generate a structured MCQ
            assessment. Review everything before
            publishing it to the existing
            assessment system.
          </p>
        </div>

        <div style={styles.aiBadge}>
          <span style={styles.aiDot}>
            ●
          </span>
          Gemini AI
        </div>
      </div>


      {error ? (
        <div style={styles.messageWrapper}>
          <ErrorMessage
            message={error}
          />
        </div>
      ) : null}


      {success ? (
        <div style={styles.successBox}>
          <strong>
            ✓ Success
          </strong>

          <p style={styles.successText}>
            {success}
          </p>

          {publishedAssessmentId ? (
            <p style={styles.successMeta}>
              Assessment ID:{" "}
              {publishedAssessmentId}
            </p>
          ) : null}
        </div>
      ) : null}


      {/* ====================================================
          GENERATOR CONFIGURATION
      ===================================================== */}

      <section style={styles.card}>

        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>
              1. Configure quiz generation
            </h2>

            <p style={styles.cardSubtitle}>
              Choose the source document and
              generation preferences.
            </p>
          </div>
        </div>


        {/* FILE UPLOAD */}

        <div style={styles.uploadArea}>

          {!file ? (
            <>
              <div style={styles.uploadIcon}>
                ↑
              </div>

              <h3 style={styles.uploadTitle}>
                Upload training material
              </h3>

              <p style={styles.uploadText}>
                Supported formats: PDF, PPTX,
                TXT
              </p>

              <p style={styles.uploadHint}>
                Maximum file size: 20 MB
              </p>

              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                style={styles.primaryButton}
              >
                Choose Document
              </button>
            </>
          ) : (
            <div style={styles.selectedFile}>
              <div style={styles.fileIcon}>
                {getExtension(
                  file.name
                ).replace(
                  ".",
                  ""
                ).toUpperCase()}
              </div>

              <div style={styles.fileDetails}>
                <strong
                  style={styles.fileName}
                >
                  {file.name}
                </strong>

                <span style={styles.fileMeta}>
                  {formatFileSize(
                    file.size
                  )}
                </span>
              </div>

              <button
                type="button"
                onClick={removeFile}
                style={styles.secondaryButton}
              >
                Remove
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.pptx,.txt"
            onChange={handleFileChange}
            style={styles.hiddenInput}
          />
        </div>


        {/* CONFIGURATION */}

        <form
          onSubmit={generateQuiz}
          style={styles.configurationGrid}
        >

          <div style={styles.field}>
            <label style={styles.label}>
              Number of questions
            </label>

            <select
              value={questionCount}
              onChange={(event) =>
                setQuestionCount(
                  event.target.value
                )
              }
              style={styles.input}
            >
              <option value="5">
                5 questions
              </option>

              <option value="10">
                10 questions
              </option>

              <option value="15">
                15 questions
              </option>

              <option value="20">
                20 questions
              </option>
            </select>
          </div>


          <div style={styles.field}>
            <label style={styles.label}>
              Difficulty
            </label>

            <select
              value={difficulty}
              onChange={(event) =>
                setDifficulty(
                  event.target.value
                )
              }
              style={styles.input}
            >
              <option value="">
                AI decides
              </option>

              <option value="easy">
                Easy
              </option>

              <option value="medium">
                Medium
              </option>

              <option value="hard">
                Hard
              </option>
            </select>
          </div>


          <div style={styles.field}>
            <label style={styles.label}>
              Competency focus
            </label>

            <select
              value={competencyName}
              onChange={(event) =>
                setCompetencyName(
                  event.target.value
                )
              }
              style={styles.input}
            >
              <option value="">
                AI identifies from document
              </option>

              {competencies.map(
                (competency) => (
                  <option
                    key={competency.id}
                    value={
                      competency.name
                    }
                  >
                    {competency.name}
                  </option>
                )
              )}
            </select>
          </div>


          <div style={styles.generateButtonWrapper}>
            <button
              type="submit"
              disabled={
                generating ||
                !file
              }
              style={
                generating ||
                !file
                  ? styles.disabledButton
                  : styles.primaryButton
              }
            >
              {generating
                ? "Generating with Gemini..."
                : "Generate Quiz"}
            </button>
          </div>

        </form>

      </section>


      {/* ====================================================
          GENERATED QUIZ
      ===================================================== */}

      {quiz ? (
        <section style={styles.card}>

          <div style={styles.cardHeader}>
            <div>
              <p style={styles.stepLabel}>
                2. AI-generated preview
              </p>

              <h2 style={styles.cardTitle}>
                {quiz.title ||
                  "Generated Quiz"}
              </h2>

              <p style={styles.cardSubtitle}>
                {quiz.description ||
                  "Review and edit the generated questions before publishing."}
              </p>
            </div>

            <button
              type="button"
              onClick={clearGeneratedQuiz}
              style={styles.secondaryButton}
            >
              Clear Preview
            </button>
          </div>


          <div style={styles.reviewBanner}>
            <strong>
              Trainer review required
            </strong>

            <span>
              AI-generated questions should be
              checked before publishing.
            </span>
          </div>


          <div style={styles.questionCountBar}>
            <span>
              {quiz.questions.length} question
              {quiz.questions.length === 1
                ? ""
                : "s"}
            </span>

            <span>
              {Object.keys(
                reviewedQuestions
              ).length} reviewed
            </span>
          </div>


          <div style={styles.questions}>

            {quiz.questions.map(
              (question, index) => {

                const normalized =
                  normalizeQuestion(
                    question,
                    index
                  );

                return (
                  <article
                    key={
                      normalized.id
                    }
                    style={styles.questionCard}
                  >

                    <div
                      style={
                        styles.questionHeader
                      }
                    >
                      <div>
                        <span
                          style={
                            styles.questionNumber
                          }
                        >
                          Question{" "}
                          {index + 1}
                        </span>

                        <span
                          style={
                            styles.difficultyBadge
                          }
                        >
                          {normalized.difficulty}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeQuestion(
                            index
                          )
                        }
                        disabled={
                          quiz.questions
                            .length <= 1
                        }
                        style={
                          quiz.questions
                            .length <= 1
                            ? styles.disabledSmallButton
                            : styles.dangerButton
                        }
                      >
                        Remove
                      </button>
                    </div>


                    <div style={styles.field}>
                      <label
                        style={styles.label}
                      >
                        Competency
                      </label>

                      <input
                        type="text"
                        value={
                          question.competency ||
                          ""
                        }
                        onChange={(event) =>
                          updateQuestion(
                            index,
                            "competency",
                            event.target.value
                          )
                        }
                        placeholder="Competency"
                        style={styles.input}
                      />
                    </div>


                    <div style={styles.field}>
                      <label
                        style={styles.label}
                      >
                        Question
                      </label>

                      <textarea
                        value={
                          question.question ||
                          ""
                        }
                        onChange={(event) =>
                          updateQuestion(
                            index,
                            "question",
                            event.target.value
                          )
                        }
                        style={
                          styles.questionTextarea
                        }
                      />
                    </div>


                    <div style={styles.optionsGrid}>

                      {[
                        "A",
                        "B",
                        "C",
                        "D",
                      ].map(
                        (
                          optionLabel,
                          optionIndex
                        ) => {

                          const option =
                            question.options?.[
                              optionIndex
                            ] || {
                              value:
                                optionLabel,
                              text:
                                "",
                            };

                          return (
                            <div
                              key={
                                optionLabel
                              }
                              style={
                                styles.optionRow
                              }
                            >
                              <span
                                style={
                                  optionLabel ===
                                  String(
                                    question.correct_answer ||
                                      ""
                                  )
                                    .trim()
                                    .toUpperCase()
                                    ? styles.correctOptionLabel
                                    : styles.optionLabel
                                }
                              >
                                {
                                  optionLabel
                                }
                              </span>

                              <input
                                type="text"
                                value={
                                  option.text ||
                                  ""
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateOption(
                                    index,
                                    optionIndex,
                                    "text",
                                    event
                                      .target
                                      .value
                                  )
                                }
                                placeholder={`Option ${optionLabel}`}
                                style={
                                  styles.optionInput
                                }
                              />
                            </div>
                          );
                        }
                      )}

                    </div>


                    <div
                      style={
                        styles.reviewGrid
                      }
                    >

                      <div style={styles.field}>
                        <label
                          style={
                            styles.label
                          }
                        >
                          Correct answer
                        </label>

                        <select
                          value={
                            String(
                              question.correct_answer ||
                                ""
                            )
                              .trim()
                              .toUpperCase()
                          }
                          onChange={(
                            event
                          ) =>
                            updateQuestion(
                              index,
                              "correct_answer",
                              event.target.value
                            )
                          }
                          style={
                            styles.input
                          }
                        >
                          <option value="">
                            Select answer
                          </option>

                          <option value="A">
                            A
                          </option>

                          <option value="B">
                            B
                          </option>

                          <option value="C">
                            C
                          </option>

                          <option value="D">
                            D
                          </option>
                        </select>
                      </div>


                      <div style={styles.field}>
                        <label
                          style={
                            styles.label
                          }
                        >
                          Difficulty
                        </label>

                        <select
                          value={
                            question.difficulty ||
                            "medium"
                          }
                          onChange={(
                            event
                          ) =>
                            updateQuestion(
                              index,
                              "difficulty",
                              event.target.value
                            )
                          }
                          style={
                            styles.input
                          }
                        >
                          <option value="easy">
                            Easy
                          </option>

                          <option value="medium">
                            Medium
                          </option>

                          <option value="hard">
                            Hard
                          </option>
                        </select>
                      </div>

                    </div>


                    <div style={styles.field}>
                      <label
                        style={
                          styles.label
                        }
                      >
                        Explanation
                      </label>

                      <textarea
                        value={
                          question.explanation ||
                          ""
                        }
                        onChange={(event) =>
                          updateQuestion(
                            index,
                            "explanation",
                            event.target.value
                          )
                        }
                        placeholder="Explain why the selected answer is correct."
                        style={
                          styles.textarea
                        }
                      />
                    </div>


                    <div style={styles.field}>
                      <label
                        style={
                          styles.label
                        }
                      >
                        Hint
                      </label>

                      <input
                        type="text"
                        value={
                          question.hint ||
                          ""
                        }
                        onChange={(event) =>
                          updateQuestion(
                            index,
                            "hint",
                            event.target.value
                          )
                        }
                        placeholder="Optional learner hint"
                        style={styles.input}
                      />
                    </div>


                    {reviewedQuestions[
                      index
                    ] ? (
                      <div
                        style={
                          styles.reviewedIndicator
                        }
                      >
                        ✓ Edited / reviewed
                      </div>
                    ) : null}

                  </article>
                );
              }
            )}

          </div>


          {/* ==================================================
              PUBLISH
          =================================================== */}

          <div style={styles.publishPanel}>

            <div>
              <p style={styles.stepLabel}>
                3. Publish to assessment system
              </p>

              <h2 style={styles.publishTitle}>
                Final assessment details
              </h2>

              <p
                style={
                  styles.cardSubtitle
                }
              >
                Publishing sends the reviewed
                questions into the existing
                assessment architecture.
              </p>
            </div>


            <div style={styles.field}>
              <label style={styles.label}>
                Assessment title
              </label>

              <input
                type="text"
                value={publishTitle}
                onChange={(event) =>
                  setPublishTitle(
                    event.target.value
                  )
                }
                style={styles.input}
                placeholder="Assessment title"
              />
            </div>


            <div style={styles.field}>
              <label style={styles.label}>
                Description
              </label>

              <textarea
                value={
                  publishDescription
                }
                onChange={(event) =>
                  setPublishDescription(
                    event.target.value
                  )
                }
                style={styles.textarea}
                placeholder="Assessment description"
              />
            </div>


            <div style={styles.publishActions}>

              <button
                type="button"
                onClick={publishQuiz}
                disabled={publishing}
                style={
                  publishing
                    ? styles.disabledButton
                    : styles.primaryButton
                }
              >
                {publishing
                  ? "Publishing..."
                  : "Publish Assessment"}
              </button>

            </div>

          </div>

        </section>
      ) : null}


      {/* ====================================================
          HOW IT WORKS
      ===================================================== */}

      <section style={styles.infoGrid}>

        <div style={styles.infoCard}>
          <span style={styles.infoNumber}>
            01
          </span>

          <h3 style={styles.infoTitle}>
            Upload
          </h3>

          <p style={styles.infoText}>
            Trainer uploads a machine-readable
            PDF, PowerPoint, or text document.
          </p>
        </div>


        <div style={styles.infoCard}>
          <span style={styles.infoNumber}>
            02
          </span>

          <h3 style={styles.infoTitle}>
            Generate
          </h3>

          <p style={styles.infoText}>
            Gemini analyses the extracted
            training content and creates
            structured MCQs.
          </p>
        </div>


        <div style={styles.infoCard}>
          <span style={styles.infoNumber}>
            03
          </span>

          <h3 style={styles.infoTitle}>
            Review
          </h3>

          <p style={styles.infoText}>
            Trainer can edit questions,
            options, answers, competency,
            difficulty, and explanations.
          </p>
        </div>


        <div style={styles.infoCard}>
          <span style={styles.infoNumber}>
            04
          </span>

          <h3 style={styles.infoTitle}>
            Publish
          </h3>

          <p style={styles.infoText}>
            Approved questions are stored
            through the existing assessment
            system for learners.
          </p>
        </div>

      </section>

    </div>
  );
}


const styles = {
  page: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "24px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "24px",
    marginBottom: "28px",
  },

  eyebrow: {
    margin: "0 0 8px",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "1.2px",
    opacity: 0.65,
  },

  title: {
    margin: 0,
    fontSize: "34px",
    lineHeight: 1.15,
  },

  subtitle: {
    maxWidth: "760px",
    margin: "12px 0 0",
    lineHeight: 1.6,
    opacity: 0.72,
  },

  aiBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    borderRadius: "999px",
    border: "1px solid #d8d8d8",
    fontSize: "13px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  aiDot: {
    fontSize: "10px",
  },

  messageWrapper: {
    marginBottom: "18px",
  },

  successBox: {
    marginBottom: "18px",
    padding: "16px 18px",
    borderRadius: "12px",
    border: "1px solid #b8d8c0",
    background: "#f4fbf6",
  },

  successText: {
    margin: "6px 0 0",
    lineHeight: 1.5,
  },

  successMeta: {
    margin: "8px 0 0",
    fontSize: "13px",
    opacity: 0.7,
  },

  card: {
    marginBottom: "24px",
    padding: "24px",
    borderRadius: "16px",
    border: "1px solid #dedede",
    background: "#ffffff",
    boxShadow:
      "0 8px 30px rgba(0, 0, 0, 0.05)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "22px",
  },

  cardTitle: {
    margin: 0,
    fontSize: "22px",
  },

  cardSubtitle: {
    margin: "7px 0 0",
    lineHeight: 1.5,
    opacity: 0.65,
  },

  stepLabel: {
    margin: "0 0 7px",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.8px",
    opacity: 0.65,
  },

  uploadArea: {
    padding: "30px",
    marginBottom: "24px",
    borderRadius: "14px",
    border: "2px dashed #cfcfcf",
    textAlign: "center",
  },

  uploadIcon: {
    marginBottom: "10px",
    fontSize: "34px",
    fontWeight: 700,
  },

  uploadTitle: {
    margin: "0 0 7px",
    fontSize: "18px",
  },

  uploadText: {
    margin: 0,
    opacity: 0.7,
  },

  uploadHint: {
    margin: "6px 0 18px",
    fontSize: "13px",
    opacity: 0.5,
  },

  selectedFile: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    textAlign: "left",
  },

  fileIcon: {
    width: "52px",
    height: "52px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    border: "1px solid #d5d5d5",
    fontSize: "11px",
    fontWeight: 800,
  },

  fileDetails: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  fileName: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  fileMeta: {
    fontSize: "13px",
    opacity: 0.6,
  },

  hiddenInput: {
    display: "none",
  },

  configurationGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "16px",
    alignItems: "end",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },

  label: {
    fontSize: "13px",
    fontWeight: 700,
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    borderRadius: "9px",
    border: "1px solid #cccccc",
    background: "#ffffff",
    fontSize: "14px",
  },

  textarea: {
    width: "100%",
    minHeight: "90px",
    boxSizing: "border-box",
    padding: "11px 12px",
    borderRadius: "9px",
    border: "1px solid #cccccc",
    background: "#ffffff",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
  },

  questionTextarea: {
    width: "100%",
    minHeight: "110px",
    boxSizing: "border-box",
    padding: "12px",
    borderRadius: "9px",
    border: "1px solid #cccccc",
    background: "#ffffff",
    fontSize: "15px",
    fontFamily: "inherit",
    lineHeight: 1.5,
    resize: "vertical",
  },

  generateButtonWrapper: {
    display: "flex",
    alignItems: "flex-end",
  },

  primaryButton: {
    border: "none",
    borderRadius: "9px",
    padding: "11px 17px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    background: "#111111",
    color: "#ffffff",
  },

  secondaryButton: {
    border: "1px solid #cfcfcf",
    borderRadius: "9px",
    padding: "10px 15px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    background: "#ffffff",
    color: "#222222",
  },

  dangerButton: {
    border: "1px solid #d8bcbc",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    background: "#fff8f8",
    color: "#8a3030",
  },

  disabledButton: {
    border: "none",
    borderRadius: "9px",
    padding: "11px 17px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "not-allowed",
    background: "#cfcfcf",
    color: "#666666",
  },

  disabledSmallButton: {
    border: "1px solid #dddddd",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "not-allowed",
    background: "#f3f3f3",
    color: "#999999",
  },

  reviewBanner: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    marginBottom: "18px",
    padding: "14px 16px",
    borderRadius: "10px",
    border: "1px solid #e2e2e2",
    background: "#fafafa",
    fontSize: "13px",
  },

  questionCountBar: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    marginBottom: "14px",
    borderBottom: "1px solid #eeeeee",
    fontSize: "13px",
    fontWeight: 700,
    opacity: 0.7,
  },

  questions: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  questionCard: {
    padding: "20px",
    borderRadius: "13px",
    border: "1px solid #dedede",
    background: "#fcfcfc",
  },

  questionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
  },

  questionNumber: {
    marginRight: "8px",
    fontSize: "13px",
    fontWeight: 800,
  },

  difficultyBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "999px",
    background: "#eeeeee",
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "capitalize",
  },

  optionsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "10px",
    margin: "16px 0",
  },

  optionRow: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
  },

  optionLabel: {
    width: "30px",
    height: "30px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "7px",
    background: "#eeeeee",
    fontSize: "12px",
    fontWeight: 800,
  },

  correctOptionLabel: {
    width: "30px",
    height: "30px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "7px",
    background: "#111111",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: 800,
  },

  optionInput: {
    flex: 1,
    minWidth: 0,
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #cccccc",
    fontSize: "14px",
  },

  reviewGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "14px",
    marginBottom: "14px",
  },

  reviewedIndicator: {
    marginTop: "12px",
    fontSize: "12px",
    fontWeight: 700,
    opacity: 0.7,
  },

  publishPanel: {
    marginTop: "24px",
    padding: "22px",
    borderRadius: "13px",
    border: "1px solid #d8d8d8",
    background: "#f8f8f8",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  publishTitle: {
    margin: 0,
    fontSize: "19px",
  },

  publishActions: {
    display: "flex",
    justifyContent: "flex-end",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "14px",
    marginBottom: "30px",
  },

  infoCard: {
    padding: "18px",
    borderRadius: "13px",
    border: "1px solid #dedede",
    background: "#ffffff",
  },

  infoNumber: {
    fontSize: "11px",
    fontWeight: 800,
    opacity: 0.45,
  },

  infoTitle: {
    margin: "8px 0 6px",
    fontSize: "16px",
  },

  infoText: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.5,
    opacity: 0.65,
  },
};