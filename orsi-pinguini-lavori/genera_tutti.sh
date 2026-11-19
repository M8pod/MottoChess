for n in orsiP pinguiniP orsiB pinguiniB orsiN pinguiniN orsiQ pinguiniQ orsiK pinguiniK; do
  echo "=== $n"; immagina --muto --senza-descrizione --varianti 2 --formato quadrato "$(cat $n.txt)" | grep -E "png$" | sed "s|^|$n |"
done
