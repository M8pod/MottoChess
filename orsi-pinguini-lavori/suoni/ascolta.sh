#!/bin/zsh
# uso: ascolta.sh "etichetta" file.wav ["etichetta" file.wav ...] — dice l'etichetta e suona due volte
while [ $# -ge 2 ]; do
  lockf /tmp/ongaku-ascolto.lock zsh -c "say -v 'Federica (Premium)' '$1'; afplay '$2'; afplay '$2'"
  shift 2
done
