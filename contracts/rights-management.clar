;; Rights Management Contract

;; Constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_AUTHORIZED (err u401))
(define-constant ERR_NOT_FOUND (err u404))

;; Data Maps
(define-map content-rights
  { content-id: uint }
  {
    owner: principal,
    license-type: (string-ascii 50),
    expiration: (optional uint),
    transferable: bool
  }
)

(define-data-var content-nonce uint u0)

;; Functions
(define-public (register-content-rights (license-type (string-ascii 50)) (expiration (optional uint)) (transferable bool))
  (let
    ((new-content-id (+ (var-get content-nonce) u1)))
    (map-set content-rights
      { content-id: new-content-id }
      {
        owner: tx-sender,
        license-type: license-type,
        expiration: expiration,
        transferable: transferable
      }
    )
    (var-set content-nonce new-content-id)
    (ok new-content-id)
  )
)

(define-public (transfer-rights (content-id uint) (new-owner principal))
  (let
    ((rights (unwrap! (map-get? content-rights { content-id: content-id }) ERR_NOT_FOUND)))
    (asserts! (is-eq tx-sender (get owner rights)) ERR_NOT_AUTHORIZED)
    (asserts! (get transferable rights) ERR_NOT_AUTHORIZED)
    (ok (map-set content-rights
      { content-id: content-id }
      (merge rights { owner: new-owner })
    ))
  )
)

(define-public (update-license (content-id uint) (new-license-type (string-ascii 50)))
  (let
    ((rights (unwrap! (map-get? content-rights { content-id: content-id }) ERR_NOT_FOUND)))
    (asserts! (is-eq tx-sender (get owner rights)) ERR_NOT_AUTHORIZED)
    (ok (map-set content-rights
      { content-id: content-id }
      (merge rights { license-type: new-license-type })
    ))
  )
)

(define-read-only (get-content-rights (content-id uint))
  (map-get? content-rights { content-id: content-id })
)

