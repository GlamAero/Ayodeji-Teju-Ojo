# Miva Student Portfolio

A responsive student portfolio and academic planner for Ayodeji Teju-Ojo. The site is built with plain HTML, CSS, and JavaScript and has no build step.

## Pages

- `index.html` — portfolio home and featured work
- `about.html` — academic background and developing skills
- `project.html` — coursework, independent work, and collaboration
- `resume.html` — education, experience, and skills; print or save as PDF
- `academic_planner.html` — courses and tasks saved in the current browser
- `contact.html` — prepares an email in the visitor’s mail app

## Personalize before publishing

Replace bracketed prompts in the About, Projects, Résumé, and Contact pages with accurate details. Add a real email address to the contact details so the contact form can open a draft. Do not add achievements, grades, or experience you cannot substantiate.

## Deploy with GitHub Pages

This repository includes a GitHub Actions workflow at `.github/workflows/pages.yml`. It publishes the static site whenever a commit is pushed to `main` and also supports manual runs.

1. Create a GitHub repository and push this project to its `main` branch.
2. In the repository, open **Settings → Pages** and set the publishing source to **GitHub Actions**.
3. Open **Actions** and wait for the **Deploy static site to GitHub Pages** workflow to complete.
4. GitHub will show the published website URL in the `github-pages` deployment environment and in **Settings → Pages**.

The workflow needs the repository’s Pages deployment permissions. GitHub creates the `github-pages` environment on the first deployment. See [GitHub’s Pages Actions documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Academic planner storage

Planner entries use browser local storage. They stay on the device and browser where they were entered; they are not sent to a server or synchronized between devices.
