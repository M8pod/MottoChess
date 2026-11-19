#!/bin/zsh
# uso: suona1.sh "etichetta" file [volte] — annuncia e suona, riprovando se l'audio del Mac si inceppa
for n in $(seq ${3:-1}); do
lockf /tmp/ongaku-ascolto.lock zsh -c "say -v 'Federica (Premium)' '$1'; for t in 1 2 3 4; do afplay '$2' 2>/dev/null && exit 0; sleep 0.5; done; exit 1" || echo "FALLITO $2"
done
