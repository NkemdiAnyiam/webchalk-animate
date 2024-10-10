# Webimator

Webimator is a web animation framework that supports the development of interactive algorithm visualizations, providing a library of preset animations and  beginner-friendly API that can be used to animate DOM elements (i.e., the contents on a webpage which are produced by HTML code).

## Installation

```bash
npm install webimator
```

### First Time Installing a Package?
<details>
  <summary>Expand/Collapse Section</summary>
  
A "package" is essentially a downloadable library of code that you can use alongside your _own_ code. For example, the animation framework Webimator is a package that can be downloaded using the command above, and you can use it with your code to help create your own animated visualizations.

Managing packages manually would be tedious since they are constantly being updated with new versions, deprecations, conflicts, etc. That is why it is common to install packages using a "package manager".

#### 1. Install Node.js
To install Webimator, you must use NPM (Node Package Manager). It is the package manager for Node.js, which is a runtime environment for JavaScript. NPM actually comes _with_ Node, so the first step to installing a package is to [install Node.js](https://nodejs.org/en/download/prebuilt-installer). After this, you can check to make sure Node and NPM are installed by opening any command-line interface (CLI) and running the following:

```bash
node --version
```
```bash
npm --version
```

#### 2. Initialize a Project
Now that Node is installed, we need to create a project. Create a folder (named whatever you want) and open it in any coding environment. I highly recommend [installing Visual Studio Code (VS Code)](https://code.visualstudio.com/download), which is a free feature-rich code editor. Next, open the terminal (the CLI for the coding environment) and run the following command:

```bash
npm init --yes
```

This will initialize a new Node project (do not worry about filling out all of the fields—the `--yes` flag tells it to just select default options. If you would actually like to fill them out manually, omit the `--yes` flag). A new file called `package.json` should now exist. This (along with a file we will soon see named `package-lock.json`) records important details about the project, including any dependencies (packages).

#### 3. Install Webimator
Now you can use the command given at the beginning of the [Installation section](#installation) (repeated here for convenience):

```bash
npm install webimator
```

NPM will install the specified package (in this case, `webimator`) as a "dependency". That means that the package is required for your code to work if you were to, say, publish your project online for users to look at.
</details>

## Usage

(Work in progress)
