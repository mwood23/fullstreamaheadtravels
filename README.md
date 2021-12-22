## FullStreamAheadTravels

Digital photo frame of FullStreamAhead's travel adventures.

## Helpful scripts

Rename all images in a folder to incrementing numbers

```sh
num=0; for i in *; do mv "$i" "$(printf '%04d' $num).${i#*.}"; ((num++)); done
```
