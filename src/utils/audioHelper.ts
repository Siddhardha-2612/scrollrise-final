/**
 * Silent Audio Helper stubs to completely stop all sound functionalities
 * as per exact user request.
 */

export function playRobotBootSound() {
  // Silent
}

export function playRobotShutdownSound() {
  // Silent
}

export function playRobotPartClickSound(type: 'antenna' | 'head' | 'torso' | 'arm' | 'leg' | 'click') {
  // Silent
}

export function startRobotCrySound(): { stop: () => void } {
  return {
    stop: () => {
      // Silent
    }
  };
}
