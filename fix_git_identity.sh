#!/bin/bash

set -e  # Exit on error
echo "🚀 Starting Git identity correction..."

# Correct identity
CORRECT_NAME="omprakash24d"
CORRECT_EMAIL="omprakash24d@gmail.com"

# Old incorrect identity
OLD_EMAIL="dr.omprakashmbbs@gmail.com"

try() {
    "$@" || echo "⚠️ Failed: $*"
    }

    # Step 1: Set Global Git Identity
    echo "✅ Setting global Git user.name and user.email..."
    try git config --global user.name "$CORRECT_NAME"
    try git config --global user.email "$CORRECT_EMAIL"

    # Step 2: Set Local Git Identity
    echo "✅ Setting local Git user.name and user.email..."
    try git config user.name "$CORRECT_NAME"
    try git config user.email "$CORRECT_EMAIL"

    # Step 3: Clear any stored credentials
    echo "🧹 Clearing saved Git credentials..."
    try rm -f ~/.git-credentials
    try git config --global --unset credential.helper

    # Step 4: Rewrite commit history to remove old email
    echo "🧽 Rewriting all commits authored by $OLD_EMAIL..."
    try git filter-branch --env-filter "
    if [ \"\$GIT_COMMITTER_EMAIL\" = \"$OLD_EMAIL\" ]
    then
        export GIT_COMMITTER_NAME=\"$CORRECT_NAME\"
            export GIT_COMMITTER_EMAIL=\"$CORRECT_EMAIL\"
            fi
            if [ \"\$GIT_AUTHOR_EMAIL\" = \"$OLD_EMAIL\" ]
            then
                export GIT_AUTHOR_NAME=\"$CORRECT_NAME\"
                    export GIT_AUTHOR_EMAIL=\"$CORRECT_EMAIL\"
                    fi
                    " --tag-name-filter cat -- --branches --tags

                    # Step 5: Force push rewritten history
                    echo "🚀 Force pushing cleaned commit history..."
                    try git push --force --all
                    try git push --force --tags

                    # Step 6: Add .gitconfig to ensure local identity lock
                    echo "📄 Creating project-level .gitconfig..."
                    echo "[user]
                        name = $CORRECT_NAME
                            email = $CORRECT_EMAIL" > .gitconfig

                            try git config include.path ../.gitconfig

                            echo "✅ Done! All commits should now show as $CORRECT_NAME <$CORRECT_EMAIL> only."