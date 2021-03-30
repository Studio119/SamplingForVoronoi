# Pseudo-Code



**Algorithm 1:** Attribute spatial association based sampling

---

**Input: **			_A_: the point set; _r_: radius parameter; _min\_r_: minimum radius;

**Output: **		_S_: sampled set;

**Algorithm: **   Random: randomly returns an element from the set; KDE: kernel-density estimate; Label: the label of point, processed by the clustering algorithm; Dist: the Euclidean distance between the given two points; Entropy: the entropy of the set;

_S_ ← ∅; _T_ ← ∅;

**while** _A_ ≠ ∅ **or** _T_ ≠ ∅ **do**

​	**if** _T_ ≠ ∅ **then** 

​		_c_ ← _Random_(_T_); _T_ ← _T_ \ _c_; add _c_ into _S_;

​	**else**

​		_c_ ← _Random_(_A_); _A_ ← _A_ \ _c_; add _c_ into _S_;

​	_radius_ ← _Max_(_r_ / _KDE_(_c_), _min\_r_);

​	_neighbors_ ← ∅;

​	add _Label_(_pi_) into _neighbors_, _Dist_(_c_, _pi_) ≤ _radius_, all _pi_ ∈ (_A_ + _T_);

​	_radius_ ← (_radius_ - _min\_r_) / (1 + _Entropy_(_neighbors_)) + _min\_r_;

​	_disabled_ ← ∅; _active_ ← ∅;

​	add _pi_ into disabled, _Dist_(_c_, _pi_) ≤ _radius_, all _pi_ ∈ (_A_ + _T_);

​	add _pi_ into _active_,  _radius_ < _Dist_(_c_, _pi_) ≤ 2 * _radius_, all _pi_ ∈ (_A_ + _T_);

​	_A_ ← _A_ \ _pi_, all _pi_ ∈ (_disabled_ + _active_);

​	_T_ ← _T_ \ _pi_, all _pi_ ∈ (_disabled_ + _active_);

​	add _pi_ into _T_, all _pi_ ∈ _active_;

**end while**;

**return** _S_;

---



​		

​		

​		