# simplified-js-project

[![Greenkeeper badge](https://badges.greenkeeper.io/emileber/simplified-js-project.svg)](https://greenkeeper.io/)

Simplifying team work with tools and automation.

## Gulp tasks

_Note that any task may be used without a global `gulp` install by replacing `gulp` in each command with `npm run task --`._

A bunch of useful gulp tasks have been copied from the [ionic-better-structure](https://github.com/flavordaaave/ionic-better-structure) created by [flavordaaave](https://github.com/flavordaaave) and modified to work with our project requirements.

### Task Listing

- `gulp help`

    Displays all of the available gulp tasks.

### Code Analysis

- `gulp lint [--verbose]`

    Performs static code analysis on all javascript files. Runs eslint.

### Fonts and Images

- `gulp fonts`

    Copy the ionic fonts from source to the build folder.

- `gulp images`

    Copy and optimize all images from source to the build folder.

### Styles

- `gulp styles`

    Compile `.scss` files to CSS and copy to the temp and build folder.


### Building Production Code

- `gulp optimize`

    Optimize all javascript and styles, move to a build folder, and inject them into the new index.html.

- `gulp build`

    Copies the fonts, images and optimises the js to build the production code into the `build` folder.

### Testing
_To be implemented, there are no tests at the moment..._

- `gulp test`

    Runs all unit tests using karma runner & jasmine with phantomjs. Depends on lint task, for code analysis.

### Cleaning Up

- `gulp clean` Remove all files from the build and temp folders.
- `gulp clean-images` Remove all images from the build folder.
- `gulp clean-code` Remove all javascript and html from the build folder.
- `gulp clean-fonts` Remove all fonts from the build folder.
- `gulp clean-styles` Remove all styles from the temp and build folders.
