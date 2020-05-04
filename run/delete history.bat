@echo off
cls
echo DELETAR?
pause
cd ..
git checkout --orphan temp_branch
git add -A
git commit -am "the first commit"
git branch -D master
git branch -m master
git push -f origin master
pause