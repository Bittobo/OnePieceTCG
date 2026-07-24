function normalize(value) {
    return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}
function mergeGroups(target, source) {
    target.setCode ??= source.setCode;
    target.boxes.push(...source.boxes);
    target.packs.push(...source.packs);
    target.isComplete = target.boxes.length > 0 && target.packs.length > 0;
}
function setOrder(group) {
    const code = (group.setCode ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const families = [
        [/^OP0*(\d+)/, 0],
        [/^EB0*(\d+)/, 1],
        [/^PRB0*(\d+)/, 2],
    ];
    for (const [pattern, family] of families) {
        const match = code.match(pattern);
        if (match?.[1]) {
            return [family, Number(match[1]), group.setName];
        }
    }
    return [3, Number.MAX_SAFE_INTEGER, group.setName];
}
export function groupSealedItems(items) {
    const groupsByName = new Map();
    for (const item of items) {
        if (item.kind !== 'box' && item.kind !== 'pack')
            continue;
        const nameKey = normalize(item.setName);
        const group = groupsByName.get(nameKey) ?? {
            key: nameKey,
            setName: item.setName,
            setCode: item.setCode,
            boxes: [],
            packs: [],
            isComplete: false,
        };
        if (item.kind === 'box')
            group.boxes.push(item);
        else
            group.packs.push(item);
        group.setCode ??= item.setCode;
        group.isComplete = group.boxes.length > 0 && group.packs.length > 0;
        groupsByName.set(nameKey, group);
    }
    const groupsByCode = new Map();
    const groupsWithoutCode = [];
    for (const group of groupsByName.values()) {
        if (!group.setCode) {
            groupsWithoutCode.push(group);
            continue;
        }
        const codeKey = normalize(group.setCode);
        const existing = groupsByCode.get(codeKey);
        if (existing)
            mergeGroups(existing, group);
        else
            groupsByCode.set(codeKey, { ...group, key: codeKey });
    }
    return [...groupsByCode.values(), ...groupsWithoutCode]
        .map((group) => ({
        ...group,
        boxes: group.boxes.sort((left, right) => left.name.localeCompare(right.name)),
        packs: group.packs.sort((left, right) => left.name.localeCompare(right.name)),
    }))
        .sort((left, right) => {
        const leftOrder = setOrder(left);
        const rightOrder = setOrder(right);
        return (leftOrder[0] - rightOrder[0] ||
            leftOrder[1] - rightOrder[1] ||
            leftOrder[2].localeCompare(rightOrder[2]));
    });
}
//# sourceMappingURL=sealed-sets.js.map