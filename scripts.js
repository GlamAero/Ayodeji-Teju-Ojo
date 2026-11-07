(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [
    ...root.querySelectorAll(selector),
  ];

  // Keep the copyright year current on every page.
  $$("[data-year]").forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  // Accessible mobile navigation.
  const menuButton = $(".menu-toggle");
  const navigation = $(".nav-links");

  if (menuButton && navigation) {
    const closeMenu = () => {
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open navigation");
      navigation.classList.remove("open");
    };

    menuButton.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") !== "true";
      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.setAttribute(
        "aria-label",
        isOpen ? "Close navigation" : "Open navigation",
      );
      navigation.classList.toggle("open", isOpen);
    });

    navigation.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMenu();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
  }

  // Print the résumé or save it as a PDF.
  $$("[data-print]").forEach((button) => {
    button.addEventListener("click", () => window.print());
  });

  // ---- Contact form: JavaScript validation ----
  const contactForm = $("[data-contact-form]");

  if (contactForm) {
    const fields = {
      name: {
        input: $("#name", contactForm),
        error: $('[data-error-for="name"]', contactForm),
      },
      email: {
        input: $("#email", contactForm),
        error: $('[data-error-for="email"]', contactForm),
      },
      phone: {
        input: $("#phone", contactForm),
        error: $('[data-error-for="phone"]', contactForm),
      },
      subject: {
        input: $("#subject", contactForm),
        error: $('[data-error-for="subject"]', contactForm),
      },
      message: {
        input: $("#message", contactForm),
        error: $('[data-error-for="message"]', contactForm),
      },
    };

    const setFieldError = (key, message) => {
      const field = fields[key];
      if (!field || !field.input) return;
      if (field.error) field.error.textContent = message;
      field.input.classList.toggle("invalid", Boolean(message));
      field.input.setAttribute("aria-invalid", message ? "true" : "false");
    };

    const clearFieldError = (key) => setFieldError(key, "");

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const digitsOnly = /^\d+$/;

    const validateContact = () => {
      let valid = true;

      const name = fields.name.input.value.trim();
      if (!name) {
        setFieldError("name", "Please enter your name.");
        valid = false;
      } else {
        clearFieldError("name");
      }

      const email = fields.email.input.value.trim();
      if (!email) {
        setFieldError("email", "Please enter your email address.");
        valid = false;
      } else if (!emailPattern.test(email)) {
        setFieldError(
          "email",
          "Enter a valid email address, e.g. name@example.com.",
        );
        valid = false;
      } else {
        clearFieldError("email");
      }

      const phone = fields.phone.input.value.trim();
      if (!phone) {
        setFieldError("phone", "Please enter your phone number.");
        valid = false;
      } else if (!digitsOnly.test(phone)) {
        setFieldError("phone", "Phone number must contain digits only.");
        valid = false;
      } else {
        clearFieldError("phone");
      }

      const subject = fields.subject.input.value.trim();
      if (!subject) {
        setFieldError("subject", "Please enter a subject.");
        valid = false;
      } else {
        clearFieldError("subject");
      }

      const message = fields.message.input.value.trim();
      if (!message) {
        setFieldError("message", "Please enter a message.");
        valid = false;
      } else {
        clearFieldError("message");
      }

      return valid;
    };

    Object.keys(fields).forEach((key) => {
      const input = fields[key].input;
      if (!input) return;
      input.addEventListener("input", () => clearFieldError(key));
    });

    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formNote = $("[data-form-note]", contactForm);

      if (!validateContact()) {
        if (formNote) {
          formNote.textContent =
            "Please fix the highlighted fields before continuing.";
        }
        return;
      }

      const addressText =
        $(".contact-detail .contact-value")?.textContent.trim() ?? "";
      const addressMatch = addressText.match(
        /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
      );

      if (!addressMatch) {
        if (formNote) {
          formNote.textContent =
            "Add a valid email address to the contact details before using this form.";
        }
        return;
      }

      const formData = new FormData(contactForm);
      const subject = encodeURIComponent(String(formData.get("subject")));
      const body = encodeURIComponent(
        `From: ${formData.get("name")} (${formData.get("email")}, ${formData.get("phone")})\n\n${formData.get("message")}`,
      );

      window.location.href = `mailto:${addressMatch[0]}?subject=${subject}&body=${body}`;

      if (formNote) {
        formNote.textContent =
          "Your email app should open with a prepared draft.";
      }
    });
  }

  // ---- Academic planner ----
  const courseForm = $("[data-course-form]");
  const taskForm = $("[data-task-form]");

  if (!courseForm || !taskForm) return;

  const storageKey = "ayodeji-academic-planner-v1";
  const emptyState = { courses: [], tasks: [] };
  let state = emptyState;

  try {
    const savedState = window.localStorage.getItem(storageKey);
    if (savedState) state = JSON.parse(savedState);
  } catch {
    state = emptyState;
  }

  if (!state || !Array.isArray(state.courses) || !Array.isArray(state.tasks)) {
    state = emptyState;
  }

  state.courses = state.courses.filter(
    (course) => course && course.id && typeof course.name === "string",
  );
  state.tasks = state.tasks.filter(
    (task) => task && task.id && typeof task.title === "string",
  );

  let activeFilter = "all";

  const createId = () =>
    window.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const saveState = () => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // The interface still works for this visit when storage is blocked.
    }
    renderPlanner();
  };

  const formatDate = (date, options) =>
    new Date(`${date}T00:00:00`).toLocaleDateString(undefined, options);

  const getLocalToday = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 10);
  };

  function renderPlanner() {
    const courseList = $("[data-course-list]");
    const courseSelect = $('[name="course"]', taskForm);
    const courseEmpty = $("[data-course-empty]");
    const taskList = $("[data-task-list]");
    const taskEmpty = $("[data-task-empty]");

    courseList.replaceChildren();

    state.courses.forEach((course) => {
      const item = document.createElement("li");
      const name = document.createElement("span");
      const removeButton = document.createElement("button");

      name.textContent = course.name;
      removeButton.type = "button";
      removeButton.className = "course-delete";
      removeButton.textContent = "Remove";
      removeButton.setAttribute("aria-label", `Remove ${course.name}`);
      removeButton.addEventListener("click", () => {
        state.courses = state.courses.filter(
          (savedCourse) => savedCourse.id !== course.id,
        );
        state.tasks.forEach((task) => {
          if (task.courseId === course.id) task.courseId = "";
        });
        saveState();
      });

      item.append(name, removeButton);
      courseList.append(item);
    });

    courseEmpty.hidden = state.courses.length > 0;

    const selectedCourse = courseSelect.value;
    courseSelect.replaceChildren(new Option("General study", ""));
    state.courses.forEach((course) =>
      courseSelect.add(new Option(course.name, course.id)),
    );
    if ([...courseSelect.options].some((o) => o.value === selectedCourse)) {
      courseSelect.value = selectedCourse;
    }

    const visibleTasks = state.tasks
      .filter((task) => {
        if (activeFilter === "open") return !task.done;
        if (activeFilter === "done") return task.done;
        return true;
      })
      .sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"));

    taskList.replaceChildren();

    visibleTasks.forEach((task) => {
      const item = document.createElement("li");
      const checkbox = document.createElement("input");
      const details = document.createElement("div");
      const title = document.createElement("span");
      const metadata = document.createElement("span");
      const removeButton = document.createElement("button");
      const course = state.courses.find((c) => c.id === task.courseId);
      const courseLabel = document.createElement("span");
      const dueLabel = document.createElement("span");

      item.className = `task-item${task.done ? " completed" : ""}`;
      checkbox.type = "checkbox";
      checkbox.checked = Boolean(task.done);
      checkbox.setAttribute(
        "aria-label",
        `${task.done ? "Mark incomplete" : "Mark complete"}: ${task.title}`,
      );
      checkbox.addEventListener("change", () => {
        task.done = checkbox.checked;
        saveState();
      });

      title.className = "task-title";
      title.textContent = task.title;
      metadata.className = "task-meta";
      courseLabel.textContent = course?.name || "General study";
      if (!task.due) {
        dueLabel.textContent = "No due date";
      } else if (task.due < getLocalToday()) {
        dueLabel.className = "overdue";
        dueLabel.textContent = `Overdue · ${formatDate(task.due, { month: "short", day: "numeric", year: "numeric" })}`;
      } else if (task.due === getLocalToday()) {
        dueLabel.textContent = "Due today";
      } else {
        dueLabel.textContent = `Due ${formatDate(task.due, { month: "short", day: "numeric", year: "numeric" })}`;
      }
      metadata.append(courseLabel, dueLabel);

      if (task.priority && task.priority !== "Normal") {
        const priority = document.createElement("span");
        priority.className = `priority${task.priority === "High" ? " high" : ""}`;
        priority.textContent = `${task.priority} priority`;
        metadata.append(priority);
      }

      details.append(title, metadata);
      removeButton.type = "button";
      removeButton.className = "task-delete";
      removeButton.textContent = "×";
      removeButton.setAttribute("aria-label", `Delete ${task.title}`);
      removeButton.addEventListener("click", () => {
        state.tasks = state.tasks.filter((t) => t.id !== task.id);
        saveState();
      });

      item.append(checkbox, details, removeButton);
      taskList.append(item);
    });

    taskEmpty.hidden = visibleTasks.length > 0;

    const openTasks = state.tasks.filter((task) => !task.done);
    $("[data-course-count]").textContent = state.courses.length;
    $("[data-task-count]").textContent = openTasks.length;

    const nextTask = openTasks
      .filter((task) => task.due)
      .sort((a, b) => a.due.localeCompare(b.due))[0];
    const nextCourse =
      nextTask && state.courses.find((c) => c.id === nextTask.courseId);

    if (!nextTask) {
      $("[data-next-deadline]").textContent = "Nothing scheduled";
    } else if (nextTask.due < getLocalToday()) {
      $("[data-next-deadline]").textContent =
        `Overdue · ${formatDate(nextTask.due, { month: "short", day: "numeric" })}`;
    } else if (nextTask.due === getLocalToday()) {
      $("[data-next-deadline]").textContent = "Due today";
    } else {
      $("[data-next-deadline]").textContent = formatDate(nextTask.due, {
        month: "short",
        day: "numeric",
      });
    }
    $("[data-deadline-course]").textContent = nextTask
      ? `${nextTask.title}${nextCourse ? ` · ${nextCourse.name}` : ""}`
      : "Add a task to get started";
  }

  courseForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = $('[name="course"]', courseForm);
    const name = input.value.trim();
    if (!name) return;

    state.courses.push({ id: createId(), name });
    input.value = "";
    saveState();
  });

  taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(taskForm);
    const title = String(formData.get("title")).trim();
    if (!title) return;

    state.tasks.push({
      id: createId(),
      title,
      courseId: String(formData.get("course") || ""),
      due: String(formData.get("due") || ""),
      priority: String(formData.get("priority") || "Normal"),
      done: false,
    });
    taskForm.reset();
    saveState();
  });

  $$("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      $$("[data-filter]").forEach((fb) => {
        const isActive = fb === button;
        fb.classList.toggle("active", isActive);
        fb.setAttribute("aria-pressed", String(isActive));
      });
      renderPlanner();
    });
  });

  $("[data-clear-completed]")?.addEventListener("click", () => {
    state.tasks = state.tasks.filter((task) => !task.done);
    saveState();
  });

  renderPlanner();
})();
