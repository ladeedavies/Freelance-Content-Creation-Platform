import { describe, it, expect, beforeEach } from "vitest"

describe("Rights Management Contract", () => {
  let mockStorage: Map<string, any>
  let contentNonce: number
  
  beforeEach(() => {
    mockStorage = new Map()
    contentNonce = 0
  })
  
  const mockContractCall = (method: string, args: any[], sender: string) => {
    switch (method) {
      case "register-content-rights":
        const [licenseType, expiration, transferable] = args
        contentNonce++
        mockStorage.set(`content-${contentNonce}`, {
          owner: sender,
          licenseType,
          expiration,
          transferable,
        })
        return { success: true, value: contentNonce }
      case "transfer-rights":
        const [transferContentId, newOwner] = args
        const content = mockStorage.get(`content-${transferContentId}`)
        if (!content || content.owner !== sender || !content.transferable) {
          return { success: false, error: "Not authorized or not transferable" }
        }
        content.owner = newOwner
        mockStorage.set(`content-${transferContentId}`, content)
        return { success: true }
      case "update-license":
        const [updateContentId, newLicenseType] = args
        const updateContent = mockStorage.get(`content-${updateContentId}`)
        if (!updateContent || updateContent.owner !== sender) {
          return { success: false, error: "Not authorized" }
        }
        updateContent.licenseType = newLicenseType
        mockStorage.set(`content-${updateContentId}`, updateContent)
        return { success: true }
      case "get-content-rights":
        return { success: true, value: mockStorage.get(`content-${args[0]}`) }
      default:
        return { success: false, error: "Method not found" }
    }
  }
  
  it("should register content rights", () => {
    const result = mockContractCall("register-content-rights", ["CC BY-SA", null, true], "creator1")
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
  })
  
  it("should transfer rights", () => {
    mockContractCall("register-content-rights", ["CC BY-SA", null, true], "creator1")
    const result = mockContractCall("transfer-rights", [1, "newowner"], "creator1")
    expect(result.success).toBe(true)
  })
  
  it("should not transfer non-transferable rights", () => {
    mockContractCall("register-content-rights", ["CC BY-SA", null, false], "creator1")
    const result = mockContractCall("transfer-rights", [1, "newowner"], "creator1")
    expect(result.success).toBe(false)
  })
  
  it("should update license", () => {
    mockContractCall("register-content-rights", ["CC BY-SA", null, true], "creator1")
    const result = mockContractCall("update-license", [1, "CC BY-NC"], "creator1")
    expect(result.success).toBe(true)
  })
  
  it("should get content rights", () => {
    mockContractCall("register-content-rights", ["CC BY-SA", null, true], "creator1")
    const result = mockContractCall("get-content-rights", [1], "anyone")
    expect(result.success).toBe(true)
    expect(result.value.licenseType).toBe("CC BY-SA")
    expect(result.value.transferable).toBe(true)
  })
})

