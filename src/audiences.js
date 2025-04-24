export default {
    me: (base_state = 'EVERYONE', allow = [], deny = []) => ({ privacy: { allow, deny, base_state } }),
    group: to_id => ({ to_id }),
}