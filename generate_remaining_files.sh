#!/bin/bash

# Create all necessary directories
echo "Creating directory structure..."
mkdir -p src/{screens/{auth,main,companion,chat,booking,payment,profile,settings,search,location,reviews,video,emergency,support,legal,verification,events},components/{common,cards,chat,booking,profile},services,utils,hooks,constants,assets/{images,fonts},navigation}

# Create placeholder logo image
mkdir -p src/assets/images
touch src/assets/images/logo.png
touch src/assets/images/onboarding{1,2,3,4}.png

echo "All directories and placeholder images created!"
echo "✅ Project structure is ready!"
