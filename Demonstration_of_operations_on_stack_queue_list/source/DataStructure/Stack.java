package source.DataStructure;

import java.util.Collections;

public class Stack extends DataStructure {

    @Override //Push
    public void insert(int value) {
        elements.add(value); 
    }

    @Override //Pop
    public void delete(int value) {
        if (!elements.isEmpty()) {
            elements.remove(elements.size() - 1); 
        }
    }

    @Override
    public boolean find(int value) {
        return elements.contains(value); 
    }

    @Override
    public void sort() {
        Collections.sort(elements);
    }

    @Override
    public String getType(){
        return "Stack";
    }
}
