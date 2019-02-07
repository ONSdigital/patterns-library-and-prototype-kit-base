#!/bin/sh

setup_git() {
  # Set the user name and email to match the API token holder
  # This will make sure the git commits will have the correct photo
  # and the user gets the credit for a checkin
  git config --global user.email "bameyrick@gmail.com"
  git config --global user.name "Ben Meyrick"
  git config --global push.default matching
  
  # Get the credentials from a file
  git config credential.helper "store --file=.git/credentials"
  
  # This associates the API Key with the account
  echo "https://${GITHUB_API_KEY}:@github.com" > .git/credentials
}

make_version() {
  local build_head=$(git rev-parse HEAD)

  git config --replace-all remote.origin.fetch +refs/heads/*:refs/remotes/origin/*
  git fetch
  git fetch --tags
  git show-ref
  
  # create the tacking branches
  for branch in $(git branch -r|grep -v HEAD) ; do
      git checkout -qf ${branch#origin/}
  done

  # git branch
  # # Echo the status to the log so that we can see it is OK
  git status

  git checkout origin/master

  git branch
  
  # Run the deploy build and increment the package versions
  # %s is the placeholder for the created tag
  npm version $TRAVIS_BRANCH -m "chore: release version %s [skip ci]"

  git status

  git push origin master
}

# upload_files() {
#   # git push origin
# }

setup_git
make_version
# upload_files
