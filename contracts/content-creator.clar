;; Content Creator

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u401))
(define-constant ERR_NOT_FOUND (err u404))

;; Data Maps
(define-map creators
  { creator-id: uint }
  {
    owner: principal,
    name: (string-ascii 50),
    bio: (string-utf8 500)
  }
)

(define-data-var creator-nonce uint u0)

;; Functions
(define-public (register-creator (name (string-ascii 50)) (bio (string-utf8 500)))
  (let
    ((new-creator-id (+ (var-get creator-nonce) u1)))
    (map-set creators
      { creator-id: new-creator-id }
      {
        owner: tx-sender,
        name: name,
        bio: bio
      }
    )
    (var-set creator-nonce new-creator-id)
    (ok new-creator-id)
  )
)

(define-public (update-profile (creator-id uint) (name (string-ascii 50)) (bio (string-utf8 500)))
  (let
    ((creator (unwrap! (map-get? creators { creator-id: creator-id }) ERR_NOT_FOUND)))
    (asserts! (is-eq tx-sender (get owner creator)) ERR_NOT_AUTHORIZED)
    (ok (map-set creators
      { creator-id: creator-id }
      (merge creator { name: name, bio: bio })
    ))
  )
)

(define-read-only (get-creator-profile (creator-id uint))
  (map-get? creators { creator-id: creator-id })
)

