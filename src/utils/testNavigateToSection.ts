/**
 * Test utility for manually calling navigateToSection from browser console
 * 
 * Usage in browser console:
 * window.testNavigateToSection()
 */

export function testNavigateToSection() {
  const payload = {
    "badge": "MOBEUS CAREER",
    "title": "Welcome",
    "subtitle": "Getting started",
    "generativeSubsections": [
      {
        "id": "3847-A",
        "templateId": "GlassmorphicOptions",
        "props": {
          "bubbles": [
            {
              "label": "Yes, I'm ready"
            },
            {
              "label": "Not just yet"
            },
            {
              "label": "Tell me more"
            }
          ]
        }
      }
    ]
  };

  console.log("=== TEST: Calling navigateToSection ===");
  console.log("Payload:", JSON.stringify(payload, null, 2));
  
  // Check if navigateToSection is available
  const navigateToSection = (window as any).__siteFunctions?.navigateToSection;
  
  if (!navigateToSection) {
    console.error("❌ navigateToSection not found on window.__siteFunctions");
    console.log("Available functions:", Object.keys((window as any).__siteFunctions || {}));
    return;
  }
  
  console.log("✅ navigateToSection found, calling it...");
  
  try {
    const result = navigateToSection(payload);
    console.log("=== RESULT ===");
    console.log("Return value:", result);
    console.log("Return type:", typeof result);
    console.log("Is boolean?", typeof result === 'boolean');
    console.log("Is object?", typeof result === 'object' && result !== null);
    
    if (typeof result === 'object' && result !== null) {
      console.log("Result properties:", Object.keys(result));
      console.log("disableNewResponseCreation?", (result as any).disableNewResponseCreation);
    }
    
    console.log("=== TEST COMPLETE ===");
    return result;
  } catch (error) {
    console.error("❌ Error calling navigateToSection:", error);
    console.error("Error stack:", (error as Error).stack);
  }
}

// Also add a version that checks getGreetingOptions
export function testGetGreetingOptions() {
  console.log("=== TEST: Calling getGreetingOptions ===");
  
  const getGreetingOptions = (window as any).__siteFunctions?.getGreetingOptions;
  
  if (!getGreetingOptions) {
    console.error("❌ getGreetingOptions not found on window.__siteFunctions");
    return;
  }
  
  console.log("✅ getGreetingOptions found, calling it...");
  
  try {
    const payload = getGreetingOptions();
    console.log("=== PAYLOAD RETURNED ===");
    console.log(JSON.stringify(payload, null, 2));
    
    // Now test calling navigateToSection with this payload
    console.log("\n=== Now calling navigateToSection with this payload ===");
    const navigateToSection = (window as any).__siteFunctions?.navigateToSection;
    
    if (navigateToSection) {
      const result = navigateToSection(payload);
      console.log("=== RESULT ===");
      console.log("Return value:", result);
      console.log("=== TEST COMPLETE ===");
      return result;
    } else {
      console.error("❌ navigateToSection not found");
    }
  } catch (error) {
    console.error("❌ Error:", error);
    console.error("Error stack:", (error as Error).stack);
  }
}

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as any).testNavigateToSection = testNavigateToSection;
  (window as any).testGetGreetingOptions = testGetGreetingOptions;
  console.log("✅ Test functions available:");
  console.log("  - window.testNavigateToSection()");
  console.log("  - window.testGetGreetingOptions()");
}
