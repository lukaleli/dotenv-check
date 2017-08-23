# dotenv-check

## What's that?

This is a simple Node-based command-line tool to check .env file against example file. No dependencies! (except Node)

Following script ensures that:
- example file exists
- target file exists
- example and target file is in a correct format
- target file has all env variables specified in example file
- target file has one of the allowed values (if specified in the example env file)

You can easily pipe it with your other tools during, e.g. the build process. Script returns correct exit codes for success (0) and failure (1). 

## Requirements

Node >= 6.4.0

## Usage

`./dotenv-check.js -s <EXAMPLE_FILE_PATH> -t <TARGET_FILE_PATH>`

## Example

Create `.env.example` file that serves as a template for you production `.env` files. This file is checked to the code repository.

E.g.

**.env.example**
```Shell
ENV=dev|staging|production
API_HOST=
STORE_PASSWORD=
KEY_PASSWORD=
GOOGLE_MAPS_API_KEY=
BUGSNAG_API_KEY=
CRASHLYTICS_API_KEY=
CRASHLYTICS_BUILD_SECRET=
```

**NOTE:**

**You can specify allowed values for your variables. In above example ENV variable can have one of these values: "dev" or "staging" or "production". If the target file won't follow the rule script will fail with exit code 1.**

Now create, e.g. production env file:

**.env**
```Shell
ENV=production
API_HOST=http://api.something-somewhere.com
STORE_PASSWORD=admin12345
KEY_PASSWORD=admin54321
GOOGLE_MAPS_API_KEY=daskjhf98asyfaskj98asyjhvas98yas
BUGSNAG_API_KEY=gsa9dyasgjdas0ydoashkkhasjk
CRASHLYTICS_API_KEY=uigsa9dyasgdas80ydiaskodihas
CRASHLYTICS_BUILD_SECRET=skg9d8asyohdashd90asdjkbashd90asihdas
```

And check your `.env` file against `.env.example`:

`./dotenv-check.js -s .env.example -t .env`