#!/bin/bash

# Votive Codebase Conventions Verification Script
# Ensures codebase follows established patterns

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Track specific error types for dynamic fix suggestions
HAS_JS_IMPORTS=false
HAS_PARENT_IMPORTS=false
HAS_DOCKERFILE_ISSUES=false
HAS_BARREL_ISSUES=false
HAS_REQUIRE_USAGE=false
HAS_PATH_ALIAS_ISSUES=false
HAS_DEEP_IMPORTS=false
HAS_RELATIVE_DEEP_IMPORTS=false
HAS_WILDCARD_EXPORTS=false
HAS_DEEP_BARREL_NESTING=false

# Directories to check
SRC_DIRS=("shared/src" "backend/src" "worker/src" "prompt-service/src" "app/src")
DOCKER_FILES=("backend/Dockerfile" "worker/Dockerfile" "prompt-service/Dockerfile" "app/Dockerfile")
# Packages that need @/* alias (have nested directory structure)
PACKAGES_WITH_ALIAS=("backend" "worker" "prompt-service" "app")
# All packages for other checks
ALL_PACKAGES=("shared" "backend" "worker" "prompt-service" "app")

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}        Votive Codebase Conventions Verification                ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# ============================================================================
# CHECK 1: No .js extensions in imports
# ============================================================================
echo -e "${BLUE}[1/13] Checking for .js extension imports...${NC}"

JS_IMPORTS=$(grep -rn "from ['\"].*\.js['\"]" --include="*.ts" --include="*.tsx" \
    shared/src backend/src worker/src prompt-service/src app/src 2>/dev/null || true)

if [ -n "$JS_IMPORTS" ]; then
    echo -e "${RED}  ✗ Found .js extension imports:${NC}"
    echo "$JS_IMPORTS" | while read -r line; do
        echo -e "    ${RED}$line${NC}"
    done
    ((ERRORS++))
    HAS_JS_IMPORTS=true
else
    echo -e "${GREEN}  ✓ No .js extension imports found${NC}"
fi

# ============================================================================
# CHECK 2: No parent directory imports (../)
# Note: Same-directory imports (./) are allowed
# ============================================================================
echo ""
echo -e "${BLUE}[2/13] Checking for parent directory imports (../)...${NC}"

PARENT_IMPORTS=$(grep -rn "from ['\"]\.\./" --include="*.ts" --include="*.tsx" \
    shared/src backend/src worker/src prompt-service/src app/src 2>/dev/null \
    | grep -v "\.test\." \
    | grep -v "\.spec\." \
    | grep -v "__tests__" \
    | grep -v "// @allow-relative" \
    || true)

if [ -n "$PARENT_IMPORTS" ]; then
    echo -e "${RED}  ✗ Found parent directory imports (use @/* instead):${NC}"
    echo "$PARENT_IMPORTS" | head -20 | while read -r line; do
        echo -e "    ${RED}$line${NC}"
    done
    COUNT=$(echo "$PARENT_IMPORTS" | wc -l | tr -d ' ')
    if [ "$COUNT" -gt 20 ]; then
        echo -e "    ${YELLOW}... and $((COUNT - 20)) more${NC}"
    fi
    ((ERRORS++))
    HAS_PARENT_IMPORTS=true
else
    echo -e "${GREEN}  ✓ No parent directory imports found${NC}"
fi

# ============================================================================
# CHECK 3: Info about same-directory imports (./) - just informational
# ============================================================================
echo ""
echo -e "${BLUE}[3/13] Checking same-directory imports (./)...${NC}"

SAME_DIR_IMPORTS=$(grep -rn "from ['\"]\./" --include="*.ts" --include="*.tsx" \
    shared/src backend/src worker/src prompt-service/src app/src 2>/dev/null \
    | grep -v "\.test\." \
    | grep -v "\.spec\." \
    | grep -v "__tests__" \
    || true)

if [ -n "$SAME_DIR_IMPORTS" ]; then
    COUNT=$(echo "$SAME_DIR_IMPORTS" | wc -l | tr -d ' ')
    echo -e "${GREEN}  ✓ Found $COUNT same-directory imports (allowed)${NC}"
else
    echo -e "${GREEN}  ✓ No same-directory imports found${NC}"
fi

# ============================================================================
# CHECK 4: Dockerfiles copy tsconfig.base.json
# ============================================================================
echo ""
echo -e "${BLUE}[4/13] Checking Dockerfiles for tsconfig.base.json copy...${NC}"

for dockerfile in "${DOCKER_FILES[@]}"; do
    if [ -f "$dockerfile" ]; then
        if grep -q "COPY tsconfig.base.json" "$dockerfile"; then
            echo -e "${GREEN}  ✓ $dockerfile copies tsconfig.base.json${NC}"
        else
            echo -e "${RED}  ✗ $dockerfile missing: COPY tsconfig.base.json ./${NC}"
            ((ERRORS++))
            HAS_DOCKERFILE_ISSUES=true
        fi
    else
        echo -e "${YELLOW}  ⚠ $dockerfile not found${NC}"
        ((WARNINGS++))
    fi
done

# ============================================================================
# CHECK 5: Dockerfiles copy tsup.config.ts for server packages
# ============================================================================
echo ""
echo -e "${BLUE}[5/13] Checking Dockerfiles for tsup.config.ts copy...${NC}"

TSUP_PACKAGES=("backend" "worker" "prompt-service")

for pkg in "${TSUP_PACKAGES[@]}"; do
    dockerfile="$pkg/Dockerfile"
    
    if [ -f "$dockerfile" ]; then
        # Check for shared tsup.config.ts
        if grep -q "COPY shared/tsup.config.ts" "$dockerfile"; then
            echo -e "${GREEN}  ✓ $dockerfile copies shared/tsup.config.ts${NC}"
        else
            echo -e "${RED}  ✗ $dockerfile missing: COPY shared/tsup.config.ts shared/${NC}"
            ((ERRORS++))
            HAS_DOCKERFILE_ISSUES=true
        fi
        
        # Check for package's own tsup.config.ts
        if grep -q "COPY $pkg/tsup.config.ts" "$dockerfile"; then
            echo -e "${GREEN}  ✓ $dockerfile copies $pkg/tsup.config.ts${NC}"
        else
            echo -e "${RED}  ✗ $dockerfile missing: COPY $pkg/tsup.config.ts $pkg/${NC}"
            ((ERRORS++))
            HAS_DOCKERFILE_ISSUES=true
        fi
    fi
done

# ============================================================================
# CHECK 6: Package tsconfigs extend base (skip app/tsconfig.json - it's refs only)
# ============================================================================
echo ""
echo -e "${BLUE}[6/13] Checking package tsconfigs extend base...${NC}"

for pkg in "${ALL_PACKAGES[@]}"; do
    # Skip app entirely - it uses Vite's default tsconfig structure (standalone is intentional)
    if [ "$pkg" == "app" ]; then
        echo -e "${GREEN}  ✓ app/tsconfig.app.json skipped (Vite default, standalone is intentional)${NC}"
        continue
    fi
    
    tsconfig="$pkg/tsconfig.json"
    
    if [ -f "$tsconfig" ]; then
        if grep -q '"extends".*tsconfig.base.json' "$tsconfig"; then
            echo -e "${GREEN}  ✓ $tsconfig extends tsconfig.base.json${NC}"
        else
            echo -e "${YELLOW}  ⚠ $tsconfig does not extend tsconfig.base.json (standalone)${NC}"
            ((WARNINGS++))
        fi
    fi
done

# ============================================================================
# CHECK 7: Packages with nested dirs have @/* path alias
# Note: shared is flat (no nested dirs), so it doesn't need @/*
# ============================================================================
echo ""
echo -e "${BLUE}[7/13] Checking tsconfigs for @/* path alias...${NC}"

echo -e "${GREEN}  ✓ shared/tsconfig.json skipped (flat structure, no @/* needed)${NC}"

for pkg in "${PACKAGES_WITH_ALIAS[@]}"; do
    # For app, check tsconfig.app.json
    if [ "$pkg" == "app" ]; then
        tsconfig="app/tsconfig.app.json"
    else
        tsconfig="$pkg/tsconfig.json"
    fi
    
    if [ -f "$tsconfig" ]; then
        if grep -q '"@/\*"' "$tsconfig"; then
            echo -e "${GREEN}  ✓ $tsconfig has @/* path alias${NC}"
        else
            echo -e "${RED}  ✗ $tsconfig missing @/* path alias${NC}"
            ((ERRORS++))
            HAS_PATH_ALIAS_ISSUES=true
        fi
    fi
done

# ============================================================================
# CHECK 8: Barrel exports exist in directories with 2+ files
# Rule: Every directory with 2+ related exports gets a barrel (index.ts)
# Exception: Entry point directories (app/src, backend/src, etc.) don't need barrels
# ============================================================================
echo ""
echo -e "${BLUE}[8/13] Checking for barrel exports (index.ts) in directories with 2+ files...${NC}"

# Entry point directories that don't need barrels (contain main.tsx entry point)
# Note: shared/src IS a library with barrel exports, not an entry point
ENTRY_POINT_DIRS=("app/src")

# Collect directories missing barrels
MISSING_BARRELS=""

for src_dir in "${SRC_DIRS[@]}"; do
    if [ -d "$src_dir" ]; then
        # Use process substitution to avoid subshell issues with variable updates
        while read -r dir; do
            if [ ! -d "$dir" ]; then
                continue
            fi

            # Skip entry point directories
            SKIP=false
            for entry_dir in "${ENTRY_POINT_DIRS[@]}"; do
                if [ "$dir" = "$entry_dir" ]; then
                    SKIP=true
                    break
                fi
            done
            if [ "$SKIP" = true ]; then
                continue
            fi

            # Count .ts/.tsx files (excluding test files and index.ts itself)
            TS_FILES=$(find "$dir" -maxdepth 1 \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null \
                | grep -v "\.test\." \
                | grep -v "\.spec\." \
                | grep -v "index\.ts" \
                | wc -l | tr -d ' ')

            if [ "$TS_FILES" -ge 2 ]; then
                if [ -f "$dir/index.ts" ]; then
                    echo -e "${GREEN}  ✓ $dir/index.ts exists ($TS_FILES files)${NC}"
                else
                    echo -e "${YELLOW}  ⚠ $dir has $TS_FILES files but no index.ts barrel${NC}"
                    MISSING_BARRELS="$MISSING_BARRELS$dir"$'\n'
                fi
            fi
        done < <(find "$src_dir" -type d 2>/dev/null)
    fi
done

if [ -n "$MISSING_BARRELS" ]; then
    ((WARNINGS++))
    HAS_BARREL_ISSUES=true
fi

# ============================================================================
# CHECK 9: No deep imports bypassing barrels
# Rule: Import from barrels, not files — '@/components' not '@/components/Button'
# Exception: JSON resource imports (e.g., i18n) are allowed
# ============================================================================
echo ""
echo -e "${BLUE}[9/13] Checking for deep imports bypassing barrels...${NC}"

# Find imports that go 2+ levels deep with @/ alias (but not test files)
# Pattern: '@/word/word' where second word is not index
DEEP_IMPORTS=$(grep -rn "from ['\"]@/[^'\"]*/[^'\"]*['\"]" --include="*.ts" --include="*.tsx" \
    backend/src worker/src prompt-service/src app/src 2>/dev/null \
    | grep -v "\.test\." \
    | grep -v "\.spec\." \
    | grep -v "__tests__" \
    | grep -v "/index['\"]" \
    | grep -v "\.json['\"]" \
    | grep -v "// @allow-deep-import" \
    || true)

if [ -n "$DEEP_IMPORTS" ]; then
    # Check if the parent directory has a barrel
    ACTUAL_VIOLATIONS=""
    while IFS= read -r line; do
        # Extract the import path using sed (POSIX compatible)
        IMPORT_PATH=$(echo "$line" | sed -n "s/.*from ['\"]@\/\([^'\"]*\)['\"].*/\1/p")
        # Get the first directory level
        FIRST_DIR=$(echo "$IMPORT_PATH" | cut -d'/' -f1)
        FILE_PATH=$(echo "$line" | cut -d':' -f1)
        PKG_DIR=$(echo "$FILE_PATH" | cut -d'/' -f1)
        
        # Check if barrel exists at first level
        BARREL_PATH="$PKG_DIR/src/$FIRST_DIR/index.ts"
        if [ -f "$BARREL_PATH" ]; then
            ACTUAL_VIOLATIONS="$ACTUAL_VIOLATIONS$line"$'\n'
        fi
    done <<< "$DEEP_IMPORTS"
    
    if [ -n "$ACTUAL_VIOLATIONS" ]; then
        echo -e "${YELLOW}  ⚠ Found deep imports where barrel exists (consider importing from barrel):${NC}"
        echo "$ACTUAL_VIOLATIONS" | head -10 | while read -r line; do
            if [ -n "$line" ]; then
                echo -e "    ${YELLOW}$line${NC}"
            fi
        done
        COUNT=$(echo "$ACTUAL_VIOLATIONS" | grep -c . || true)
        if [ "$COUNT" -gt 10 ]; then
            echo -e "    ${YELLOW}... and $((COUNT - 10)) more${NC}"
        fi
        ((WARNINGS++))
        HAS_DEEP_IMPORTS=true
    else
        echo -e "${GREEN}  ✓ No deep imports bypassing barrels found${NC}"
    fi
else
    echo -e "${GREEN}  ✓ No deep imports bypassing barrels found${NC}"
fi

# ============================================================================
# CHECK 10: No unaudited wildcard exports (export * from)
# Rule: Be selective — only re-export what consumers need
# Escape hatch: // @allow-wildcard
# ============================================================================
echo ""
echo -e "${BLUE}[10/13] Checking for wildcard exports (export * from)...${NC}"

WILDCARD_EXPORTS=$(grep -rn "export \* from" --include="index.ts" \
    shared/src backend/src worker/src prompt-service/src app/src 2>/dev/null \
    | grep -v "// @allow-wildcard" \
    || true)

if [ -n "$WILDCARD_EXPORTS" ]; then
    echo -e "${YELLOW}  ⚠ Found wildcard exports (consider selective re-exports):${NC}"
    echo "$WILDCARD_EXPORTS" | head -10 | while read -r line; do
        echo -e "    ${YELLOW}$line${NC}"
    done
    COUNT=$(echo "$WILDCARD_EXPORTS" | wc -l | tr -d ' ')
    if [ "$COUNT" -gt 10 ]; then
        echo -e "    ${YELLOW}... and $((COUNT - 10)) more${NC}"
    fi
    ((WARNINGS++))
    HAS_WILDCARD_EXPORTS=true
else
    echo -e "${GREEN}  ✓ No unaudited wildcard exports found${NC}"
fi

# ============================================================================
# CHECK 11: No deeply nested barrels (5+ levels)
# Rule: Max 4 barrel levels — leaf → mid → feature → root
# ============================================================================
echo ""
echo -e "${BLUE}[11/13] Checking for deeply nested barrels (5+ levels)...${NC}"

> /tmp/deep_barrels.txt
for src_dir in "${SRC_DIRS[@]}"; do
    if [ -d "$src_dir" ]; then
        # Find index.ts files and count depth from src
        while read -r barrel; do
            # Count directory depth from src (subtract base path components)
            DEPTH=$(echo "$barrel" | tr '/' '\n' | grep -c . || true)
            BASE_DEPTH=$(echo "$src_dir" | tr '/' '\n' | grep -c . || true)
            RELATIVE_DEPTH=$((DEPTH - BASE_DEPTH))
            
            if [ "$RELATIVE_DEPTH" -gt 4 ]; then
                echo "$barrel (depth: $RELATIVE_DEPTH)" >> /tmp/deep_barrels.txt
            fi
        done < <(find "$src_dir" -name "index.ts" -type f 2>/dev/null)
    fi
done

if [ -s /tmp/deep_barrels.txt ]; then
    echo -e "${YELLOW}  ⚠ Found deeply nested barrels (consider flattening):${NC}"
    cat /tmp/deep_barrels.txt | while read -r line; do
        echo -e "    ${YELLOW}$line${NC}"
    done
    ((WARNINGS++))
    HAS_DEEP_BARREL_NESTING=true
else
    echo -e "${GREEN}  ✓ No deeply nested barrels found (all ≤4 levels)${NC}"
fi
rm -f /tmp/deep_barrels.txt

# ============================================================================
# CHECK 12: No relative deep imports bypassing barrels (./)
# Rule: Import from barrels, not files — './sections' not './sections/Button'
# Exceptions: 
#   - index.ts files (barrels must import from files)
#   - JSON/resource files
#   - dynamic imports (code splitting)
#   - type-only imports
# ============================================================================
echo ""
echo -e "${BLUE}[12/13] Checking for relative deep imports (./subdir/file)...${NC}"

RELATIVE_DEEP_IMPORTS=$(grep -rn "from ['\"]\.\/[^'\"]*\/[^'\"]*['\"]" --include="*.ts" --include="*.tsx" \
    backend/src worker/src prompt-service/src app/src shared/src 2>/dev/null \
    | grep -v "\.test\." \
    | grep -v "\.spec\." \
    | grep -v "__tests__" \
    | grep -v "/index\.ts:" \
    | grep -v "\.json['\"]" \
    | grep -v "import type" \
    | grep -v "// @allow-deep-import" \
    || true)

if [ -n "$RELATIVE_DEEP_IMPORTS" ]; then
    # Check if the subdirectory has a barrel (making this a violation)
    ACTUAL_VIOLATIONS=""
    while IFS= read -r line; do
        # Extract file path and import path
        FILE_PATH=$(echo "$line" | cut -d':' -f1)
        FILE_DIR=$(dirname "$FILE_PATH")
        IMPORT_PATH=$(echo "$line" | sed -n "s/.*from ['\"]\.\/\([^'\"]*\)['\"].*/\1/p")
        SUBDIR=$(echo "$IMPORT_PATH" | cut -d'/' -f1)
        
        # Check if barrel exists in the subdirectory
        BARREL_PATH="$FILE_DIR/$SUBDIR/index.ts"
        if [ -f "$BARREL_PATH" ]; then
            ACTUAL_VIOLATIONS="$ACTUAL_VIOLATIONS$line"$'\n'
        fi
    done <<< "$RELATIVE_DEEP_IMPORTS"
    
    if [ -n "$ACTUAL_VIOLATIONS" ]; then
        echo -e "${YELLOW}  ⚠ Found relative deep imports where barrel exists:${NC}"
        echo "$ACTUAL_VIOLATIONS" | head -10 | while read -r line; do
            if [ -n "$line" ]; then
                echo -e "    ${YELLOW}$line${NC}"
            fi
        done
        COUNT=$(echo "$ACTUAL_VIOLATIONS" | grep -c . || true)
        if [ "$COUNT" -gt 10 ]; then
            echo -e "    ${YELLOW}... and $((COUNT - 10)) more${NC}"
        fi
        ((WARNINGS++))
        HAS_RELATIVE_DEEP_IMPORTS=true
    else
        echo -e "${GREEN}  ✓ No relative deep imports bypassing barrels found${NC}"
    fi
else
    echo -e "${GREEN}  ✓ No relative deep imports bypassing barrels found${NC}"
fi

# ============================================================================
# CHECK 13: No require() usage
# ============================================================================
echo ""
echo -e "${BLUE}[13/13] Checking for require() usage...${NC}"

REQUIRE_USAGE=$(grep -rn "require(['\"]" --include="*.ts" --include="*.tsx" \
    shared/src backend/src worker/src prompt-service/src app/src 2>/dev/null \
    | grep -v "\.test\." \
    | grep -v "\.spec\." \
    | grep -v "__tests__" \
    | grep -v "// @allow-require" \
    || true)

if [ -n "$REQUIRE_USAGE" ]; then
    echo -e "${RED}  ✗ Found require() usage (use ES imports instead):${NC}"
    echo "$REQUIRE_USAGE" | while read -r line; do
        echo -e "    ${RED}$line${NC}"
    done
    ((ERRORS++))
    HAS_REQUIRE_USAGE=true
else
    echo -e "${GREEN}  ✓ No require() usage found${NC}"
fi

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                          Summary                               ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${BLUE}Import Rules:${NC}"
echo -e "  • Same directory (./)     → ${GREEN}Allowed${NC}"
echo -e "  • Parent directory (../)  → ${RED}Use @/* instead${NC}"
echo -e "  • Cross-package           → ${GREEN}Use package name (e.g., 'shared')${NC}"
echo ""

echo -e "${BLUE}Barrel Export Rules:${NC}"
echo -e "  • 2+ files in directory   → ${GREEN}Create index.ts barrel${NC}"
echo -e "  • Max barrel depth        → ${GREEN}4 levels (leaf → mid → feature → root)${NC}"
echo -e "  • Wildcard exports        → ${YELLOW}Prefer selective re-exports${NC}"
echo -e "  • Import from barrel      → ${GREEN}Not from individual files${NC}"
echo ""

echo -e "${BLUE}Escape Hatches:${NC}"
echo -e "  • // @allow-relative      → Allow ../ imports"
echo -e "  • // @allow-deep-import   → Allow deep path imports"
echo -e "  • // @allow-wildcard      → Allow export * from"
echo -e "  • // @allow-require       → Allow require()"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Codebase follows conventions.${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Passed with $WARNINGS warning(s)${NC}"
    echo ""
    echo -e "${YELLOW}Suggestions:${NC}"
    if [ "$HAS_BARREL_ISSUES" = true ]; then
        echo -e "  • Create index.ts barrel exports for directories with 2+ files"
    fi
    if [ "$HAS_DEEP_IMPORTS" = true ]; then
        echo -e "  • Import from barrel (e.g., '@/components') not deep path (e.g., '@/components/Button')"
    fi
    if [ "$HAS_RELATIVE_DEEP_IMPORTS" = true ]; then
        echo -e "  • Import from barrel (e.g., './sections') not deep path (e.g., './sections/Hero')"
    fi
    if [ "$HAS_WILDCARD_EXPORTS" = true ]; then
        echo -e "  • Replace 'export * from' with selective named exports"
        echo -e "    Or add '// @allow-wildcard' comment if intentional"
    fi
    if [ "$HAS_DEEP_BARREL_NESTING" = true ]; then
        echo -e "  • Flatten barrel structure to max 4 levels"
    fi
    exit 0
else
    echo -e "${RED}✗ Found $ERRORS error(s) and $WARNINGS warning(s)${NC}"
    echo ""
    echo -e "${YELLOW}To fix:${NC}"
    if [ "$HAS_PARENT_IMPORTS" = true ]; then
        echo -e "  • Replace '../' imports with '@/' path aliases"
    fi
    if [ "$HAS_JS_IMPORTS" = true ]; then
        echo -e "  • Remove .js extensions from imports"
    fi
    if [ "$HAS_DOCKERFILE_ISSUES" = true ]; then
        echo -e "  • Add missing COPY statements to Dockerfiles (tsconfig.base.json, tsup.config.ts)"
    fi
    if [ "$HAS_PATH_ALIAS_ISSUES" = true ]; then
        echo -e "  • Add @/* path alias to tsconfig.json files"
    fi
    if [ "$HAS_REQUIRE_USAGE" = true ]; then
        echo -e "  • Replace require() with ES import statements"
    fi
    echo ""
    echo -e "${YELLOW}Suggestions:${NC}"
    if [ "$HAS_BARREL_ISSUES" = true ]; then
        echo -e "  • Create index.ts barrel exports for directories with 2+ files"
    fi
    if [ "$HAS_DEEP_IMPORTS" = true ]; then
        echo -e "  • Import from barrel (e.g., '@/components') not deep path (e.g., '@/components/Button')"
    fi
    if [ "$HAS_RELATIVE_DEEP_IMPORTS" = true ]; then
        echo -e "  • Import from barrel (e.g., './sections') not deep path (e.g., './sections/Hero')"
    fi
    if [ "$HAS_WILDCARD_EXPORTS" = true ]; then
        echo -e "  • Replace 'export * from' with selective named exports"
        echo -e "    Or add '// @allow-wildcard' comment if intentional"
    fi
    if [ "$HAS_DEEP_BARREL_NESTING" = true ]; then
        echo -e "  • Flatten barrel structure to max 4 levels"
    fi
    exit 1
fi
