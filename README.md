# 🎭 Playwright Framework
### A portable, plug-and-play Playwright automation framework with decorators, API testing support, reporting, strongly-typed utilities, and more!

---

# 🌟 Quick Start

```bash
git clone https://github.com/AAksentyev/playwright-framework.git
cd <your path>/playwright_framework
npm install
npx playwright install --with-deps
npm run test
```

## 📘 Introduction
This framework is designed to be portable, strongly typed, and ready to use out of the box regardless of project type. With built-in decorators, reporting utilities, API testing features, logging, and pre-built base classes, you can begin automated testing with minimal setup.

A fresh clone of this repo includes example tests you can run immediately. This project layout and pattern haS proven effective for me for both testing and development in the past and emphasizes type safety, reusability, and clean separation of concerns. 

If you want to explore what the framework includes, continue below.

## 📦 What's Included

This repository ships with a rich ecosystem of pre-configured modules, utilities, decorators, and reports designed to accelerate your development and testing workflow.

### 🧱 Base Classes
You get three foundational classes designed for extensibility:

**1. BaseLocator**

A safe, wrapped locator interaction class with built-in checks for interactability.
Every interaction method is decorated with a custom `@Interaction` decorator, which:

* Captures locator interactions across your suite
* Generates a per-page and per-component heatmap
* Helps identify testing gaps and low-coverage UI areas
* Produces visual overlay reports based on real test behavior

*Read more about the heatmap report here (link to be added)*

**BaseComponent**

A component-level Page Object with a root locator.
Useful for:

* Persistent UI elements
* Modular widgets
* Components reused across pages

Extends BaseLocator, inheriting all safe interaction functionality and facilitates the per-component screenshot heatmap.

**BasePage**

A page-level Page Object Model. Unlike BaseComponent, this does not use a root locator. (*todo: Add optional root locator* )

Provides:

* URL handling
* Navigation helpers
* Page-level utilities

*See more about navigation functionality here*


### 🔧 Decorators

The framework includes a library of ready-to-use decorators to enhance your code quality and maintainability.

**Interaction**

Automatically tracks locator interactions (clicks, fills, hovers, etc.).
Generates:

* Component-level heatmaps
* Page-level interaction heatmaps
* Gaps reports for untested UI regions

Helps visually validate coverage across pages and components.

**Retry**

Retries flaky or timing-sensitive methods without rerunning the whole test.

Use cases:

* Slow-loading elements with inconsistent load times
* Occasionally disabled inputs
* Intermittent UI states

Controlled via the `RETRY_ENABLED` environment variable, giving you flexibility over tolerance of flaky or inconsistent behaviour.

[*See more about Retry here here*]

**ResponseThreshold**

Monitors the performance of API calls.
If a decorated function exceeds the defined threshold, the framework:

* Logs a warning; or
* Fails the test (configurable)

Useful as an early indicator of backend slowness. (Not a replacement for load testing.)

**Step**

Wraps the activities in the decorated method in a test.step

## 📊 Reports 
Several standard and custom-built reporting systems are integrated out of the box:

**Allure Report**

* Fully configured and ready to use
* Includes post-processing enhancements
* Displays warning indicators for tests with logged warnings
* Integrates seamlessly with decorators and network logging

**Network Traffic Report**

A passive network monitor that runs during every test.

Captures:

* All API calls
* Failures (unless explicitly ignored)
* Success/failure ratios
* Domain-level summaries
* Per-test call breakdowns

Generates a consolidated summary report at the end of each run.

**Interaction Heatmap Report**

If enabled, the heatmap reporter:

* Logs all locator interactions
* Takes screenshots
* Overlays interaction markers
* Generates coverage heatmaps for pages and components and tracks action counts

Helps visually identify missing or lightly-tested UI elements.


## 🚀Roadmap

1. More decorators
2. Annotation library
3. Visual regression testing integration
4. More reports
