# T-Mobile Park
### Skill Stations Doc

#### Depth Cameras

Testing realsense D435

MacOS:

- Open Terminal

Install homebrew:
```
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

Check that installation was successful:
```
brew doctor
```

Install requirements and `librealsense`
```
brew install libusb pkg-config
brew install homebrew/core/glfw3
brew install cmake
brew install librealsense
```

Launch viewer with `realsense-viewer`

